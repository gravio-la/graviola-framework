/**
 * Comunica SPARQL adapter for RDF.js DatasetCore sources (IndexedDBDataset, N3.Store, …).
 *
 * Wraps @comunica/query-sparql-rdfjs QueryEngine to produce CRUDFunctions
 * compatible with the Graviola sparql-db-impl / initSPARQLStore API.
 *
 * Term → SPARQL JSON Results conversion follows the W3C SPARQL 1.1 JSON format:
 *   https://www.w3.org/TR/sparql11-results-json/
 *
 * Why Comunica over a hand-rolled SPARQL engine:
 *   Comunica already handles SPARQL 1.1 algebra, join ordering, OPTIONAL,
 *   FILTER, SERVICE, etc.  Its @comunica/query-sparql-rdfjs actor delegates
 *   triple pattern evaluation entirely to the RDFJS DatasetCore.match() method,
 *   so we get a full SPARQL engine with O(log n) index lookups for free.
 *
 * The CRUDFunctions contract (constructFetch / selectFetch / updateFetch /
 * askFetch) is defined in @graviola/edb-core-types and consumed by
 * initSPARQLStore from @graviola/sparql-db-impl.
 */

import { QueryEngine } from "@comunica/query-sparql-rdfjs";
import N3 from "n3";
import type {
  CRUDFunctions,
  SelectFetchOverload,
} from "@graviola/edb-core-types";
import type { DatasetCore, Literal, Term } from "@rdfjs/types";

export type CreateComunicaCRUDFunctionsOptions = {
  /**
   * Enables adapter logs when the source has no `verboseLogging`
   * (e.g. in-memory {@link import("n3").Store}).
   *
   * CONSTRUCT additionally prints the **full SPARQL** with `console.info`
   * (still visible when Vite `esbuild.pure` drops `console.debug`).
   */
  debugLogging?: boolean;
};

async function quadCount(dataset: DatasetCore): Promise<number> {
  const d = dataset as DatasetCore & {
    getSize?: () => Promise<number>;
  };
  if (typeof d.getSize === "function") {
    return d.getSize();
  }
  const withSize = dataset as DatasetCore & { readonly size?: number };
  if (typeof withSize.size === "number") {
    return withSize.size;
  }
  return 0;
}

/**
 * Convert an RDFJS Term to a SPARQL JSON Results term object.
 */
function termToSparqlJson(term: Term): Record<string, string> {
  switch (term.termType) {
    case "NamedNode":
      return { type: "uri", value: term.value };

    case "BlankNode":
      return { type: "bnode", value: term.value };

    case "Literal": {
      const lit = term as Literal;
      const result: Record<string, string> = {
        type: "literal",
        value: lit.value,
      };
      if (lit.language) {
        result["xml:lang"] = lit.language;
      } else if (
        lit.datatype &&
        lit.datatype.value !== "http://www.w3.org/2001/XMLSchema#string"
      ) {
        result.datatype = lit.datatype.value;
      }
      return result;
    }

    case "DefaultGraph":
      return { type: "uri", value: "" };

    default:
      return { type: "uri", value: term.value };
  }
}

/**
 * Build a CRUDFunctions object backed by a Comunica QueryEngine over the
 * provided RDF.js DatasetCore (writable for SPARQL UPDATE).
 *
 * The sparqlFlavour for initSPARQLStore should be "default" (standard SPARQL 1.1),
 * not "oxigraph" — Comunica does not accept Oxigraph-specific syntax extensions.
 */
const TAG = "[Comunica:adapter]";

/** One-line preview for `console.debug`; full text is logged separately via `console.info` (not stripped by typical Vite `esbuild.pure`). */
const QUERY_PREVIEW_MAX = 420;

function previewQuery(query: string): string {
  const oneLine = query.replace(/\s+/g, " ").trim();
  if (oneLine.length <= QUERY_PREVIEW_MAX) return oneLine;
  return `${oneLine.slice(0, QUERY_PREVIEW_MAX)} … [${oneLine.length} chars total — see following console.info for full SPARQL]`;
}

/** @deprecated legacy alias kept for grep; use previewQuery */
const q = previewQuery;

export function createComunicaCRUDFunctions(
  engine: QueryEngine,
  dataset: DatasetCore,
  options?: CreateComunicaCRUDFunctionsOptions,
): CRUDFunctions {
  const verbose =
    options?.debugLogging === true ||
    Boolean((dataset as { verboseLogging?: boolean }).verboseLogging);
  const log = (...args: unknown[]) => {
    if (verbose) {
      console.debug(...args);
    }
  };

  return {
    constructFetch: async (query: string) => {
      log(`${TAG} CONSTRUCT (preview)`, previewQuery(query));
      if (verbose) {
        console.info(
          `${TAG} CONSTRUCT — full SPARQL (${query.length} chars)\n${query}`,
        );
      }
      try {
        const quadsStream = await engine.queryQuads(query, {
          sources: [dataset as any],
        });
        const store = new N3.Store();
        await new Promise<void>((resolve, reject) => {
          quadsStream.on("data", (quad: any) => store.add(quad));
          quadsStream.on("end", () => resolve());
          quadsStream.on("error", reject);
        });
        log(`${TAG} CONSTRUCT → ${store.size} quads`);
        return store;
      } catch (err) {
        console.error(`${TAG} CONSTRUCT error`, err, "\nQuery:", query);
        throw err;
      }
    },

    selectFetch: (async (
      query: string,
      options?: { withHeaders?: boolean },
    ) => {
      log(`${TAG} SELECT (withHeaders=${options?.withHeaders})`, q(query));
      try {
        // Use queryBindings() directly — avoid engine.query()+metadata()+execute(), which can
        // duplicate join setup / match iterators and cause unbounded work.
        const bindingsStream = await engine.queryBindings(query, {
          sources: [dataset as any],
        });

        const extractVarNamesFromBinding = (b: unknown): string[] => {
          const bk = b as { keys?: () => Iterable<unknown> };
          const keys =
            typeof bk.keys === "function" ? Array.from(bk.keys()) : [];
          return keys.map((v) =>
            typeof v === "string"
              ? v
              : v && typeof v === "object" && "value" in v
                ? String((v as { value: string }).value)
                : String(v),
          );
        };

        const extractVarNamesFromMeta = (meta: any): string[] => {
          const vs = (meta?.variables ?? []) as unknown[];
          return vs.map((x) =>
            typeof x === "string" ? x : ((x as any)?.value ?? String(x)),
          );
        };

        /**
         * SPARQL JSON results need `head.vars` even when `bindings` is empty.
         * Register `getProperty("metadata")` *before* draining so Comunica can
         * attach variables without a long post-hoc timeout.
         */
        const metaVarsPromise = new Promise<string[]>((resolve) => {
          let settled = false;
          let metaTimer: ReturnType<typeof setTimeout> | undefined;
          const finish = (v: string[]) => {
            if (!settled) {
              settled = true;
              if (metaTimer !== undefined) clearTimeout(metaTimer);
              resolve(v);
            }
          };
          metaTimer = setTimeout(() => finish([]), 500);
          bindingsStream.getProperty("metadata", (meta: any) => {
            finish(extractVarNamesFromMeta(meta));
          });
        });

        const rawBindings = await bindingsStream.toArray();

        const vars: string[] =
          rawBindings.length > 0
            ? extractVarNamesFromBinding(rawBindings[0])
            : await metaVarsPromise;

        log(`${TAG} SELECT vars:`, vars);

        log(`${TAG} SELECT → ${rawBindings.length} rows`);

        const bindings = rawBindings.map((binding: any) => {
          const row: Record<string, Record<string, string>> = {};
          for (const varName of vars) {
            const term = binding.get(varName);
            if (term) {
              row[varName] = termToSparqlJson(term as Term);
            }
          }
          return row;
        });

        const result = { head: { vars }, results: { bindings } };
        return options?.withHeaders ? result : bindings;
      } catch (err) {
        console.error(`${TAG} SELECT error`, err, "\nQuery:", query);
        throw err;
      }
    }) as SelectFetchOverload,

    updateFetch: async (query: string) => {
      log(`${TAG} UPDATE`, q(query));
      try {
        await engine.queryVoid(query, { sources: [dataset as any] });
        const size = await quadCount(dataset);
        log(`${TAG} UPDATE done — store size now ${size}`);
      } catch (err) {
        console.error(`${TAG} UPDATE error`, err, "\nQuery:", query);
        throw err;
      }
    },

    askFetch: async (query: string) => {
      log(`${TAG} ASK`, q(query));
      try {
        const result = await engine.queryBoolean(query, {
          sources: [dataset as any],
        });
        log(`${TAG} ASK → ${result}`);
        return result;
      } catch (err) {
        console.error(`${TAG} ASK error`, err, "\nQuery:", query);
        throw err;
      }
    },
  };
}
