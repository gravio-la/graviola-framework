import type {
  CapabilityDescriptor,
  SearchesProfile,
} from "@graviola/store-core";

import type { GraviolaStoreHandshakeInner } from "./handshake-types";

const pickSearchesProfile = (
  inner: GraviolaStoreHandshakeInner,
): SearchesProfile | undefined => {
  for (const entry of Object.values(inner.types)) {
    const s = entry.capabilities.searches;
    if (s) {
      return {
        mode: s.mode,
        ranked: Boolean(s.ranked),
        caseSensitive: s.caseSensitive,
        perFieldWeights: s.perFieldWeights,
      };
    }
  }
  return undefined;
};

const anyType = (
  inner: GraviolaStoreHandshakeInner,
  key:
    | "loads"
    | "lists"
    | "filters"
    | "writes"
    | "statements"
    | "removes"
    | "counts",
): boolean => {
  return Object.values(inner.types).some((t) => Boolean(t.capabilities[key]));
};

const anySearches = (inner: GraviolaStoreHandshakeInner): boolean => {
  return Object.values(inner.types).some(
    (t) => t.capabilities.searches != null,
  );
};

/** Aggregate handshake truth into store-core CapabilityDescriptor (OR across types). */
export const capabilityDescriptorFromHandshake = (
  inner: GraviolaStoreHandshakeInner,
): CapabilityDescriptor => {
  const searchesProfile = pickSearchesProfile(inner);
  const desc: CapabilityDescriptor = { identifies: true };
  if (anyType(inner, "loads")) desc.loads = true;
  if (anyType(inner, "lists")) desc.lists = true;
  if (anyType(inner, "filters")) desc.filters = true;
  if (anyType(inner, "writes")) desc.writes = true;
  if (anyType(inner, "statements")) desc.statements = true;
  if (anyType(inner, "removes")) desc.removes = true;
  if (anyType(inner, "counts")) desc.counts = true;
  if (anySearches(inner)) desc.searches = true;
  if (anyType(inner, "loads")) desc.exists = true;
  if (inner.resolves?.supported) desc.resolves = true;
  if (inner.calc?.supported) desc.calc = true;
  if (searchesProfile) desc.profiles = { searches: searchesProfile };
  return desc;
};
