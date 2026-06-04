/**
 * Reversible, type-agnostic IRI ↔ index document id encoding (base64url, no padding).
 * Valid charset for Meilisearch / Elasticsearch / Solr / Lunr: ^[A-Za-z0-9_-]+$
 */

/** Pluggable mapping between RDF entity IRIs and engine document primary keys. */
export type IndexIdCodec = {
  encodeIriToDocId(iri: string): string;
  decodeDocIdToIri(id: string): string;
};

export function encodeIriToDocId(iri: string): string {
  const bytes = new TextEncoder().encode(iri);
  let binary = "";
  for (const b of bytes) {
    binary += String.fromCharCode(b);
  }
  const b64 =
    typeof btoa === "function"
      ? btoa(binary)
      : Buffer.from(bytes).toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeDocIdToIri(id: string): string {
  const b64 = id.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  const padded = b64 + pad;
  const binary =
    typeof atob === "function"
      ? atob(padded)
      : Buffer.from(padded, "base64").toString("binary");
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Default codec: base64url-encoded full IRI (new imports). */
export function defaultIndexIdCodec(): IndexIdCodec {
  return { encodeIriToDocId, decodeDocIdToIri };
}

const IRI_PREFIX = /^https?:\/\//;

/** Extract trailing path segment after `{entityNs}{pathSegment}/`. */
export function pathSuffixFromIri(
  iri: string,
  entityNs: string,
  pathSegment: string,
): string | null {
  const prefix = `${entityNs}${pathSegment}/`;
  if (!iri.startsWith(prefix)) return null;
  const suffix = iri.slice(prefix.length);
  return suffix || null;
}

/**
 * Legacy semanticdesk / graviola-indexer convention:
 * document id = lowercase hex digest; IRI = `{entityNs}manifestation/{hex}`.
 */
export function createManifestationHexIdCodec(entityNs: string): IndexIdCodec {
  const segment = "manifestation";
  return createPathSuffixIdCodec({ entityNs, pathSegment: segment });
}

/** Generic `{entityNs}{pathSegment}/{id}` ↔ id codec for pre-existing indexes. */
export function createPathSuffixIdCodec(options: {
  entityNs: string;
  pathSegment: string;
}): IndexIdCodec {
  const prefix = `${options.entityNs}${options.pathSegment}/`;

  return {
    encodeIriToDocId(iri: string): string {
      if (IRI_PREFIX.test(iri)) {
        const suffix = pathSuffixFromIri(
          iri,
          options.entityNs,
          options.pathSegment,
        );
        if (suffix) return suffix;
      }
      return encodeIriToDocId(iri);
    },
    decodeDocIdToIri(id: string): string {
      if (IRI_PREFIX.test(id)) return id;
      if (id.startsWith(prefix)) return id;
      return `${prefix}${id}`;
    },
  };
}

/** Sanitize a type name into a safe index uid (alphanumeric + underscore). */
export function defaultIndexUid(typeName: string): string {
  return typeName.replace(/[^A-Za-z0-9_-]/g, "_");
}
