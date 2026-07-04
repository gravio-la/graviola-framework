export const SLUB_LOD_AUTHORITY = "https://data.slub-dresden.de";

export const slubLodTypeMap: Record<string, string | string[]> = {
  Person: "persons",
  Place: "geo",
  Location: "geo",
  Occupation: "topics",
  Corporation: "organizations",
};

/** schema.org `@type` values used for SLUB `filter=` and `/reconcile/` queries. */
export const slubSchemaOrgTypeMap: Record<string, string> = {
  Person: "http://schema.org/Person",
  Corporation: "http://schema.org/Organization",
  Place: "http://schema.org/Place",
  Location: "http://schema.org/Place",
  Occupation: "http://schema.org/Thing",
};

/**
 * SLUB LOD ↔ Graviola search adapter toggles.
 * Flip `useReconcileApi` to switch from index Lucene search to OpenRefine reconciliation.
 */
export type SlubLodSearchAdapterConfig = {
  /** Send `filter=@type:…` on `/{index}/search` (see SLUB LOD search docs). */
  useSchemaOrgTypeFilter: boolean;
  /** Use POST `/reconcile/` with typed query instead of `/{index}/search`. */
  useReconcileApi: boolean;
};

export const slubLodSearchAdapterConfig: SlubLodSearchAdapterConfig = {
  useSchemaOrgTypeFilter: true,
  useReconcileApi: false,
};

export const SCHEMA_ORG_PLACE = "http://schema.org/Place";
export const SCHEMA_ORG_PLACE_HTTPS = "https://schema.org/Place";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isSchemaOrgPlace = (typeValue: unknown): boolean =>
  typeValue === SCHEMA_ORG_PLACE || typeValue === SCHEMA_ORG_PLACE_HTTPS;

export const WIKIDATA_ENTITY_PREFIX = "http://www.wikidata.org/entity/";

const WIKIDATA_CLAIMS_API =
  "https://www.wikidata.org/w/api.php?action=wbgetentities&props=claims&format=json&origin=*";

const USER_AGENT =
  "graviola-experiments/0.1 (SLUB LOD import; contact: dev@local)";

/** Memo cache: Wikidata Q-ID → bare admin-parent Q-IDs (P131, else P361). */
const parentAdminIdsCache = new Map<string, string[]>();

export const extractWikidataQIdFromIRI = (iri: string): string | null => {
  if (!iri.startsWith(WIKIDATA_ENTITY_PREFIX)) return null;
  const qId = iri.slice(WIKIDATA_ENTITY_PREFIX.length);
  return /^Q\d+$/.test(qId) ? qId : null;
};

export const extractWikidataIRIFromSameAsLinks = (
  sameAsLinks: unknown,
): string | null => {
  if (!Array.isArray(sameAsLinks)) return null;
  for (const entry of sameAsLinks) {
    const iri =
      typeof entry === "string"
        ? entry
        : entry &&
            typeof entry === "object" &&
            typeof (entry as { "@id"?: unknown })["@id"] === "string"
          ? (entry as { "@id": string })["@id"]
          : null;
    if (iri?.startsWith(WIKIDATA_ENTITY_PREFIX)) return iri;

    if (entry && typeof entry === "object") {
      const isBasedOn = (entry as { isBasedOn?: { "@id"?: string } }).isBasedOn;
      const basedOnIri = isBasedOn?.["@id"];
      if (basedOnIri?.startsWith(WIKIDATA_ENTITY_PREFIX)) return basedOnIri;
    }
  }
  return null;
};

type WikidataClaimSnak = {
  mainsnak?: {
    datavalue?: {
      value?: {
        id?: string;
      };
    };
  };
};

export const parseAdminParentIdsFromClaims = (
  claims: Record<string, WikidataClaimSnak[] | undefined> | undefined,
): string[] => {
  if (!claims) return [];
  const fromProperty = (propertyId: string): string[] => {
    const snaks = claims[propertyId];
    if (!Array.isArray(snaks)) return [];
    const ids: string[] = [];
    for (const snak of snaks) {
      const id = snak?.mainsnak?.datavalue?.value?.id;
      if (typeof id === "string" && /^Q\d+$/.test(id)) ids.push(id);
    }
    return ids;
  };
  const p131 = fromProperty("P131");
  if (p131.length > 0) return p131;
  return fromProperty("P361");
};

export const fetchWikidataAdminParentIds = async (
  qId: string,
): Promise<string[]> => {
  const cached = parentAdminIdsCache.get(qId);
  if (cached !== undefined) return cached;

  const url = `${WIKIDATA_CLAIMS_API}&ids=${encodeURIComponent(qId)}`;
  let lastError: unknown;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (attempt > 0) {
      await sleep(500 * 2 ** (attempt - 1));
    }
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
    });
    if (res.status === 429) {
      lastError = new Error(
        `Wikidata wbgetentities rate-limited (429) for ${qId}`,
      );
      continue;
    }
    if (!res.ok) {
      throw new Error(
        `Wikidata wbgetentities failed (${res.status}) for ${qId}`,
      );
    }
    const json = (await res.json()) as {
      entities?: Record<
        string,
        { claims?: Record<string, WikidataClaimSnak[] | undefined> }
      >;
    };
    const claims = json.entities?.[qId]?.claims;
    const ids = parseAdminParentIdsFromClaims(claims);
    parentAdminIdsCache.set(qId, ids);
    return ids;
  }
  throw lastError instanceof Error
    ? lastError
    : new Error(`Wikidata wbgetentities failed for ${qId}`);
};

export const enrichSlubPlaceWithAdminHierarchy = async (
  record: Record<string, unknown>,
): Promise<Record<string, unknown>> => {
  if (!isSchemaOrgPlace(record["@type"])) return record;

  const wikidataIRI = extractWikidataIRIFromSameAsLinks(
    record.sameAsLinks ?? record.sameAs,
  );
  if (!wikidataIRI) return record;

  const qId = extractWikidataQIdFromIRI(wikidataIRI);
  if (!qId) return record;

  try {
    const parentAdminIds = await fetchWikidataAdminParentIds(qId);
    if (parentAdminIds.length === 0) return record;
    return { ...record, parentAdminIds };
  } catch (error) {
    console.warn(
      `SLUB LOD admin hierarchy hop failed for ${String(record["@id"] ?? qId)}:`,
      error,
    );
    return record;
  }
};

export const sanitizeSlubLodRecord = (
  record: unknown,
): Record<string, unknown> | null => {
  if (!record || typeof record !== "object") return null;
  const { sameAs, ...rest } = record as Record<string, unknown>;
  return {
    ...rest,
    ...(sameAs !== undefined ? { sameAsLinks: sameAs } : {}),
  };
};

export const unwrapSlubLodResponse = (json: unknown): unknown | null => {
  const record = Array.isArray(json) ? json[0] : json;
  if (!record) return null;
  return sanitizeSlubLodRecord(record);
};

const normalizeSlubLodUrl = (iri: string): string => {
  if (iri.startsWith("https://data.slub-dresden.de/")) {
    return iri;
  }
  const gndHttps = iri.match(/^https?:\/\/d-nb\.info\/gnd\/([0-9X-]+)$/);
  if (gndHttps) {
    return `https://data.slub-dresden.de/gnd/${gndHttps[1]}`;
  }
  const gndPrefix = iri.match(/^gnd:([0-9X-]+)$/);
  if (gndPrefix) {
    return `https://data.slub-dresden.de/gnd/${gndPrefix[1]}`;
  }
  return iri;
};

export const getEntityFromSlubLodByIRI = async (
  iri: string,
): Promise<unknown | null> => {
  const url = normalizeSlubLodUrl(iri);
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;
  const json = await res.json();
  const record = unwrapSlubLodResponse(json);
  if (!record || typeof record !== "object") return null;
  return enrichSlubPlaceWithAdminHierarchy(record as Record<string, unknown>);
};

export type SlubLodSearchHit = {
  id: string;
  label: string;
  secondary?: string;
  avatar?: string;
  allProps: Record<string, unknown>;
};

const escapeLuceneTerm = (term: string): string =>
  term.replace(/[\\"]/g, "\\$&");

const buildSchemaOrgTypeFilter = (schemaOrgType: string): string =>
  `@type:${schemaOrgType}`;

const extractBiographicalSecondary = (
  record: Record<string, unknown>,
): string | undefined => {
  const about = record.about;
  if (!Array.isArray(about)) return undefined;
  for (const entry of about) {
    if (!entry || typeof entry !== "object") continue;
    const identifier = (
      entry as { identifier?: { propertyID?: string; value?: string } }
    ).identifier;
    if (
      identifier?.propertyID === "biographicalOrHistoricalInformation" &&
      typeof identifier.value === "string"
    ) {
      return identifier.value;
    }
  }
  return undefined;
};

const extractGndIdFromSameAs = (sameAs: unknown): string | undefined => {
  if (sameAs == null) return undefined;
  const entries = Array.isArray(sameAs) ? sameAs : [sameAs];
  for (const entry of entries) {
    const iri =
      typeof entry === "string"
        ? entry
        : entry &&
            typeof entry === "object" &&
            typeof (entry as { "@id"?: unknown })["@id"] === "string"
          ? (entry as { "@id": string })["@id"]
          : null;
    if (!iri) continue;
    const match = iri.match(/(?:d-nb\.info\/gnd\/|\/gnd\/)([0-9X-]+)/);
    if (match) return match[1];
  }
  return undefined;
};

const formatAdressRegion = (region: unknown): string | undefined => {
  if (typeof region === "string" && region.trim()) return region;
  if (Array.isArray(region)) {
    const parts = region.filter(
      (value): value is string =>
        typeof value === "string" && value.trim().length > 0,
    );
    if (parts.length > 0) return parts.join(", ");
  }
  return undefined;
};

const extractDescriptionContext = (
  description: unknown,
): string | undefined => {
  if (typeof description === "string" && description.trim()) return description;
  if (!description || typeof description !== "object") return undefined;
  const objectDescription = description as Record<string, unknown>;
  const name =
    typeof objectDescription.name === "string"
      ? objectDescription.name
      : undefined;
  const label =
    typeof objectDescription.description === "string"
      ? objectDescription.description
      : undefined;
  if (name && label) return `${label}: ${name}`;
  return name ?? label;
};

const extractNestedLocationName = (location: unknown): string | undefined => {
  if (!location || typeof location !== "object") return undefined;
  const name = (location as { name?: unknown }).name;
  return typeof name === "string" && name.trim() ? name : undefined;
};

/** Disambiguation line for finder list rows (region, GND, broader context, …). */
export const extractSlubLodSearchSecondary = (
  record: Record<string, unknown>,
): string | undefined => {
  const biographical = extractBiographicalSecondary(record);
  if (biographical) return biographical;

  const parts: string[] = [];
  const gndId = extractGndIdFromSameAs(record.sameAsLinks ?? record.sameAs);
  if (gndId) parts.push(`GND ${gndId}`);

  const region = formatAdressRegion(record.adressRegion);
  if (region) parts.push(region);

  const description = extractDescriptionContext(record.description);
  if (description) parts.push(description);

  const locationName = extractNestedLocationName(record.location);
  if (locationName) parts.push(locationName);

  return parts.length > 0 ? parts.join(" · ") : undefined;
};

const slubRecordToSearchHit = (
  record: Record<string, unknown>,
): SlubLodSearchHit | null => {
  const id = typeof record["@id"] === "string" ? record["@id"] : null;
  if (!id) return null;
  const label =
    typeof record.preferredName === "string"
      ? record.preferredName
      : typeof record.name === "string"
        ? record.name
        : id;
  return {
    id,
    label,
    secondary: extractSlubLodSearchSecondary(record),
    allProps: record,
  };
};

const normalizeSlubLodEntityIri = (id: string): string => {
  if (id.startsWith("http://") || id.startsWith("https://")) return id;
  return `${SLUB_LOD_AUTHORITY}/${id.replace(/^\//, "")}`;
};

type SlubReconcileResultEntry = {
  id?: string;
  name?: string;
  description?: string;
};

const findEntityWithinSlubLodViaIndex = async (
  searchString: string,
  typeName: string,
  limit: number,
  config: SlubLodSearchAdapterConfig,
): Promise<SlubLodSearchHit[]> => {
  const indexEntry = slubLodTypeMap[typeName];
  const index = Array.isArray(indexEntry) ? indexEntry[0] : indexEntry;
  if (!index) return [];

  const escaped = escapeLuceneTerm(searchString.trim());
  const q = `preferredName:${escaped} OR alternateName:${escaped}`;
  const params = new URLSearchParams({
    q,
    size: String(limit),
  });

  if (config.useSchemaOrgTypeFilter) {
    const schemaOrgType = slubSchemaOrgTypeMap[typeName];
    if (schemaOrgType) {
      params.set("filter", buildSchemaOrgTypeFilter(schemaOrgType));
    }
  }

  const url = `${SLUB_LOD_AUTHORITY}/${index}/search?${params.toString()}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": USER_AGENT },
  });
  if (!res.ok) {
    throw new Error(`SLUB LOD search failed (${res.status}) for ${typeName}`);
  }

  const json = await res.json();
  if (!Array.isArray(json)) return [];

  return json
    .map((raw) => sanitizeSlubLodRecord(raw))
    .filter((record): record is Record<string, unknown> => record !== null)
    .map(slubRecordToSearchHit)
    .filter((hit): hit is SlubLodSearchHit => hit !== null);
};

const findEntityWithinSlubLodViaReconcile = async (
  searchString: string,
  typeName: string,
  limit: number,
): Promise<SlubLodSearchHit[]> => {
  const schemaOrgType = slubSchemaOrgTypeMap[typeName];
  if (!schemaOrgType) return [];

  const body = new URLSearchParams({
    queries: JSON.stringify({
      q0: {
        query: searchString.trim(),
        type: schemaOrgType,
        limit,
      },
    }),
  });

  const res = await fetch(`${SLUB_LOD_AUTHORITY}/reconcile/`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": USER_AGENT,
    },
    body: body.toString(),
  });
  if (!res.ok) {
    throw new Error(
      `SLUB LOD reconcile failed (${res.status}) for ${typeName}`,
    );
  }

  const json = (await res.json()) as {
    q0?: { result?: SlubReconcileResultEntry[] };
  };
  const results = json.q0?.result;
  if (!Array.isArray(results)) return [];

  return results
    .map((entry): SlubLodSearchHit | null => {
      if (!entry.id || !entry.name) return null;
      const id = normalizeSlubLodEntityIri(entry.id);
      return {
        id,
        label: entry.name,
        secondary:
          typeof entry.description === "string" ? entry.description : undefined,
        allProps: {
          reconcilePreview: entry,
          "@id": id,
          preferredName: entry.name,
        },
      };
    })
    .filter((hit): hit is SlubLodSearchHit => hit !== null);
};

export const findEntityWithinSlubLod = async (
  searchString: string,
  typeName: string,
  limit = 10,
  config: SlubLodSearchAdapterConfig = slubLodSearchAdapterConfig,
): Promise<SlubLodSearchHit[]> => {
  if (!searchString.trim()) return [];
  if (!slubLodTypeMap[typeName]) return [];

  if (config.useReconcileApi) {
    return findEntityWithinSlubLodViaReconcile(searchString, typeName, limit);
  }

  return findEntityWithinSlubLodViaIndex(searchString, typeName, limit, config);
};
