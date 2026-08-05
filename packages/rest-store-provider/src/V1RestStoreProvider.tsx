import { CrudProviderContext, useAdbContext } from "@graviola/edb-state-hooks";
import {
  createRESTClientStore,
  type RestAuthConfig,
} from "@graviola/rest-store-client";
import {
  type FunctionComponent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";

type V1RestDataStore = Awaited<ReturnType<typeof createRESTClientStore>>;

export type V1RestStoreProviderProps = {
  children: ReactNode;
  baseUrl: string;
  auth?: RestAuthConfig;
  handshakePath?: string;
  fetchImpl?: typeof fetch;
  queryCacheScope?: string;
};

/**
 * REST store provider using v1 handshake + {@link createRESTClientStore}.
 * Puts the Store (with `filterMany` / `list` / …) into {@link CrudProviderContext}
 * — not the legacy AbstractDatastore shim, so SemanticTable JSON-LD mode works.
 */
export const V1RestStoreProvider: FunctionComponent<
  V1RestStoreProviderProps
> = ({
  children,
  baseUrl,
  auth = { mode: "none" as const },
  handshakePath = "/.well-known/graviola-store",
  fetchImpl,
  queryCacheScope = "rest",
}) => {
  const {
    typeNameToTypeIRI,
    jsonLDConfig: { defaultPrefix },
  } = useAdbContext();
  const [dataStore, setDataStore] = useState<V1RestDataStore | null>(null);

  const identifies = useMemo(
    () => ({
      typeNameToTypeIRI,
      typeIRItoTypeName: (iri: string) => iri.replace(defaultPrefix, ""),
    }),
    [typeNameToTypeIRI, defaultPrefix],
  );

  useEffect(() => {
    let cancelled = false;
    void createRESTClientStore({
      baseUrl,
      auth,
      identifies,
      iriHandling: "fullIRI",
      handshakePath,
      fetchImpl,
    }).then((store) => {
      if (!cancelled) {
        setDataStore(store);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [baseUrl, auth, identifies, handshakePath, fetchImpl]);

  return (
    <CrudProviderContext.Provider
      value={{
        crudOptions: null,
        dataStore,
        isReady: Boolean(dataStore),
        queryCacheScope,
      }}
    >
      {children}
    </CrudProviderContext.Provider>
  );
};
