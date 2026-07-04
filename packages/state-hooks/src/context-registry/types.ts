import type { AdbContextValue } from "../provider/adbContext";
import type { CrudProviderContextValue } from "../provider/crudProviderContext";

export const DEFAULT_CONTEXT_IRI = "urn:graviola:context:main";

export const GRAVIOLA_CONTEXT_IRI_PROP = "graviolaContextIRI";

export type { CrudProviderContextValue };

export type ContextDescriptor = {
  crud: CrudProviderContextValue;
  adb?: AdbContextValue<unknown>;
  label: string;
  parentContextIRI?: string;
};

export type RegisteredContext = { iri: string } & ContextDescriptor;
