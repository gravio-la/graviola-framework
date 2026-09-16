import { registerAdapter } from "./registry";

/** Optional adapter — registers when @graviola/edb-wikidata-utils is available at runtime. */
export function registerWikidataSparqlAdapter(): void {
  registerAdapter({
    id: "wikidata-sparql",
    label: "Wikidata (SPARQL)",
    description: "Search via SPARQL label service",
    search: async (query, { limit = 10 }) => {
      const sparql = `
SELECT ?item ?itemLabel ?itemDescription WHERE {
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en,de". }
  ?item rdfs:label ?itemLabel .
  FILTER(CONTAINS(LCASE(?itemLabel), LCASE("${query.replace(/"/g, '\\"')}")))
} LIMIT ${limit}`;
      const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`;
      const res = await fetch(url, {
        headers: {
          Accept: "application/sparql-results+json",
          "User-Agent": "graviola-portal/0.1",
        },
      });
      if (!res.ok) throw new Error(`Wikidata SPARQL ${res.status}`);
      const data = (await res.json()) as {
        results: { bindings: Array<Record<string, { value: string }>> };
      };
      return data.results.bindings.map((b) => {
        const iri = b.item?.value ?? "";
        const id = iri.split("/").pop() ?? iri;
        return {
          id,
          iri,
          label: b.itemLabel?.value ?? id,
          description: b.itemDescription?.value,
        };
      });
    },
    getEntity: async (iri) => {
      const id = iri.includes("/") ? iri.split("/").pop()! : iri;
      const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${id}&format=json&props=labels|descriptions|claims`;
      const res = await fetch(url, {
        headers: { "User-Agent": "graviola-portal/0.1" },
      });
      if (!res.ok) throw new Error(`Wikidata entity ${res.status}`);
      const data = await res.json();
      return data.entities?.[id] ?? data;
    },
  });
}
