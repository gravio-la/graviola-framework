import type { CRUDFunctions } from "@graviola/edb-core-types";
import type Yasgui from "@triply/yasgui";
import type Yasqe from "@triply/yasqe";
import { Writer } from "n3";

type YasqeEmitter = Yasqe & {
  emit(event: string, ...args: unknown[]): void;
  config: { queryingDisabled?: string | undefined };
  abortQuery(): void;
};

function datasetToTurtle(
  ds: Iterable<import("@rdfjs/types").Quad>,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new Writer({ format: "Turtle" });
    for (const q of ds) {
      writer.addQuad(q);
    }
    writer.end((err, result) => {
      if (err) reject(err);
      else resolve(result as string);
    });
  });
}

/** Summary object accepted by @triply/yasr Parser (non-superagent path). */
function yasrSummary(data: unknown, contentType: string) {
  return {
    data,
    contentType,
    status: 200,
  };
}

async function executeCrudAndEmitResponse(
  yasqe: YasqeEmitter,
  crud: CRUDFunctions,
  queryKey: string,
): Promise<void> {
  const queryText = yasqe.getValueWithoutComments?.() ?? yasqe.getValue();
  const qType = (yasqe.getQueryType?.() ?? "").toUpperCase();
  const mode = yasqe.getQueryMode();
  const t0 = Date.now();

  if (mode === "update") {
    await crud.updateFetch(queryText, { queryKey });
    const duration = Date.now() - t0;
    yasqe.emit(
      "queryResponse",
      yasrSummary(
        { head: { vars: [] }, results: { bindings: [] } },
        "application/sparql-results+json",
      ),
      duration,
    );
    return;
  }

  if (qType === "ASK") {
    const boolean = await crud.askFetch(queryText, { queryKey });
    const duration = Date.now() - t0;
    yasqe.emit(
      "queryResponse",
      yasrSummary({ head: {}, boolean }, "application/sparql-results+json"),
      duration,
    );
    return;
  }

  if (qType === "CONSTRUCT" || qType === "DESCRIBE") {
    const ds = await crud.constructFetch(queryText, { queryKey });
    const ttl = await datasetToTurtle(ds);
    const duration = Date.now() - t0;
    yasqe.emit("queryResponse", yasrSummary(ttl, "text/turtle"), duration);
    return;
  }

  const raw = await crud.selectFetch(queryText, {
    withHeaders: true,
    queryKey,
  });
  const duration = Date.now() - t0;
  yasqe.emit(
    "queryResponse",
    yasrSummary(raw, "application/sparql-results+json"),
    duration,
  );
}

export type CrudResolver = () => CRUDFunctions | null | undefined;

/**
 * Replaces {@link Yasqe#query} so the Run button can execute via {@link CRUDFunctions}.
 * When {@link getCrud} returns nullish, the original YASQE HTTP {@link Yasqe#query} runs
 * (remote SPARQL endpoint).
 */
export function patchYasqeQueryToUseCrud(
  yasgui: Yasgui,
  getCrud: CrudResolver,
): void {
  const tab = yasgui.getTab(yasgui.persistentConfig.currentId());
  const yasqe = tab?.getYasqe?.() as YasqeEmitter | undefined;
  if (!yasqe) return;

  const origQuery = yasqe.query.bind(yasqe);

  yasqe.query = async function queryViaCrud(config?: unknown) {
    const crud = getCrud();
    if (!crud) {
      return origQuery(config);
    }

    if (this.config.queryingDisabled) {
      return Promise.reject(new Error("Querying is disabled."));
    }
    this.abortQuery();

    const y = this as YasqeEmitter;
    const queryStart = Date.now();
    let aborted = false;
    const fakeReq = {
      abort: () => {
        aborted = true;
        y.emit("queryAbort", y, fakeReq);
      },
    };
    y.emit("query", fakeReq, config ?? {});

    try {
      await executeCrudAndEmitResponse(y, crud, "yasgui:crud");
      if (aborted) return;
    } catch (e) {
      if (!aborted) {
        y.emit("queryResponse", e, Date.now() - queryStart);
        y.emit("error", e);
      }
      throw e;
    }
  };
}
