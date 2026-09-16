import type { Candidate } from "../types";

export type SourceAdapter = {
  id: string;
  label: string;
  description?: string;
  search: (
    query: string,
    options: { typeIRI?: string; typeName?: string; limit?: number },
  ) => Promise<Candidate[]>;
  getEntity: (iri: string) => Promise<unknown>;
};

const adapters = new Map<string, SourceAdapter>();

export function registerAdapter(adapter: SourceAdapter): void {
  adapters.set(adapter.id, adapter);
}

export function getAdapter(id: string): SourceAdapter | undefined {
  return adapters.get(id);
}

export function listAdapters(): SourceAdapter[] {
  return [...adapters.values()];
}
