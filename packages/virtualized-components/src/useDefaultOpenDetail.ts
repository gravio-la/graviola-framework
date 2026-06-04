import { useCallback } from "react";
import type { JsonLdEntity } from "@graviola/edb-state-hooks";
import { useDispatchIntent } from "@graviola/edb-state-hooks";
import type { ListTypeMode } from "./listTypes";

function entityIri(doc: JsonLdEntity): string {
  return String(doc["@id"]);
}

function entityTypeIri(doc: JsonLdEntity): string | undefined {
  const t = doc["@type"];
  return typeof t === "string" ? t : undefined;
}

export function useDefaultOpenDetail(
  originSource: string,
  typeMode: ListTypeMode,
): (doc: JsonLdEntity) => void {
  const dispatchIntent = useDispatchIntent();

  return useCallback(
    (doc: JsonLdEntity) => {
      const iri = entityIri(doc);
      const typeIRI =
        typeMode.kind === "known"
          ? (typeMode.typeIRI ?? entityTypeIri(doc) ?? "")
          : (entityTypeIri(doc) ?? "");
      dispatchIntent({
        kind: "show-entity",
        entityIRI: iri,
        typeIRI: typeIRI || undefined,
        data: doc,
        origin: { source: originSource },
      });
    },
    [dispatchIntent, originSource, typeMode],
  );
}

export { entityIri, entityTypeIri };
