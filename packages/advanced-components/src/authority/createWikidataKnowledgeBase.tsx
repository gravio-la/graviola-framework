import type { SameAsTypeMap } from "@graviola/edb-core-types";
import { ClassicResultListItem } from "@graviola/edb-basic-components";
import { getEntityFromWikidataByIRI } from "@graviola/edb-wikidata-utils";
import type { FinderKnowledgeBaseDescription } from "@graviola/semantic-jsonform-types";
import Check from "@mui/icons-material/Check";
import { IconButton, Stack } from "@mui/material";
import type { ReactNode } from "react";

const WIKIDATA_AUTHORITY = "http://www.wikidata.org";
const WD_ENTITY = "http://www.wikidata.org/entity/";

export type WikidataSuggestHit = {
  id: string;
  key: string;
  title: string;
  description?: string;
  thumbnail?: { url: string };
};

export type CreateWikidataKnowledgeBaseOptions = {
  /** Local typeName → Wikidata class Q-id (or list). */
  sameAsTypeMap: SameAsTypeMap;
  icon?: ReactNode;
  label?: string;
};

/**
 * Knowledge-base description for EntityFinder: Wikidata reconciliation suggest
 * + entity fetch. Parameterized by app type map (no exhibition-schema deps).
 */
export function createWikidataKnowledgeBase(
  options: CreateWikidataKnowledgeBaseOptions,
): FinderKnowledgeBaseDescription<WikidataSuggestHit, Record<string, unknown>> {
  const { sameAsTypeMap, icon, label = "Wikidata" } = options;

  return {
    id: "wikidata",
    label,
    authorityIRI: WIKIDATA_AUTHORITY,
    description: "Wikidata",
    icon: icon ?? "W",
    find: async (searchString, _typeIRI, typeName, findOptions) => {
      const type = sameAsTypeMap[typeName];
      const reconciliationURL = new URL(
        "https://wikidata.reconci.link/en/suggest/entity",
      );
      reconciliationURL.search = new URLSearchParams({
        prefix: searchString,
        ...(type ? { type: Array.isArray(type) ? type.join(",") : type } : {}),
      }).toString();
      const response = await fetch(reconciliationURL.toString(), {
        method: "GET",
      });
      const data = (await response.json()) as {
        result?: Array<{ id: string; name: string; description?: string }>;
      };
      const limit = findOptions?.limit ?? 20;
      return (data.result ?? []).slice(0, limit).map((item) => ({
        id: item.id,
        key: item.id,
        title: item.name,
        description: item.description,
        thumbnail: { url: "" },
      }));
    },
    getEntity: async (id) => {
      const iri = id.startsWith("http") ? id : `${WD_ENTITY}${id}`;
      return (await getEntityFromWikidataByIRI(iri, {
        rank: "preferred",
      })) as Record<string, unknown>;
    },
    listItemRenderer: (entry, idx, _typeIRI, selected, onSelect, onAccept) => {
      const wikidataEntityIRI = `${WD_ENTITY}${entry.key}`;
      const handleAccept = () => {
        void getEntityFromWikidataByIRI(wikidataEntityIRI, {
          rank: "preferred",
        }).then((res) => {
          onAccept?.(wikidataEntityIRI, {
            ...entry,
            allProps: res,
          } as never);
        });
      };
      return (
        <ClassicResultListItem
          key={entry.key}
          id={wikidataEntityIRI}
          index={idx}
          onSelected={(id, index) => onSelect?.(id, index)}
          label={entry.title}
          secondary={entry.description}
          avatar={entry.thumbnail?.url}
          altAvatar={String(idx + 1)}
          selected={selected}
          onEnter={handleAccept}
          listItemProps={{
            secondaryAction: (
              <Stack direction="row" spacing={1}>
                <IconButton onClick={handleAccept} aria-label="Accept">
                  <Check />
                </IconButton>
              </Stack>
            ),
          }}
        />
      );
    },
  };
}

/** Extract Wikidata entity IRI from local geo IRI (`…/City/Q515`) or sameAs. */
export function wikidataIriFromEntity(
  data:
    | {
        "@id"?: string;
        sameAs?: string | string[];
      }
    | null
    | undefined,
): string | null {
  if (!data) return null;
  const sameAs = data.sameAs;
  const candidates = [
    ...(typeof sameAs === "string"
      ? [sameAs]
      : Array.isArray(sameAs)
        ? sameAs
        : []),
    typeof data["@id"] === "string" ? data["@id"] : "",
  ].filter(Boolean);
  for (const c of candidates) {
    if (c.includes("wikidata.org/entity/")) {
      const m = c.match(/Q\d+/);
      return m ? `${WD_ENTITY}${m[0]}` : c;
    }
    const q = c.match(/(?:\/|^)(Q\d+)(?:\/|$)/);
    if (q) return `${WD_ENTITY}${q[1]}`;
  }
  return null;
}

export { WIKIDATA_AUTHORITY };
