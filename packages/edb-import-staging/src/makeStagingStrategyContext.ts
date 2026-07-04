import type {
  IRIToStringFn,
  NormDataMappings,
  PrimaryFieldDeclaration,
} from "@graviola/edb-core-types";
import { makeDefaultMappingStrategyContext } from "@graviola/data-mapping-hooks";
import type {
  AuthorityConfiguration,
  DeclarativeMapping,
  StrategyContext,
} from "@graviola/edb-data-mapping";
import type { StagedChangeSet, StrategyTrace } from "./types";

export type MainStoreProbe = {
  findDocumentsByAuthorityIRI?: (
    typeName: string,
    secondaryIRI: string,
    authorityIRI: string,
  ) => Promise<string[]>;
  searchByLabel?: (
    typeName: string,
    label: string,
    limit: number,
  ) => Promise<Array<{ ["@id"]?: string }>>;
};

export type MakeStagingStrategyContextOptions = {
  changeSet: StagedChangeSet;
  mainStore?: MainStoreProbe;
  mappingId: string;
  sourceRef?: string;
  schemaVersion?: string;
  mappingVersion?: string;
  /** Reserved parent for entities staged at mapping root path (direct children of the import root). */
  rootIRI?: string;
  createEntityIRI: (typeIRI: string) => string;
  typeIRItoTypeName: IRIToStringFn;
  primaryFields: PrimaryFieldDeclaration;
  authorityAccess?: Record<string, AuthorityConfiguration>;
  normDataMappings?: NormDataMappings<DeclarativeMapping>;
  disableLogging?: boolean;
};

const pathKey = (path: string[]): string => path.join("/");

const parentPathKey = (path: string[]): string | undefined => {
  if (path.length === 0) return undefined;
  if (path.length === 1) return "";
  return path.slice(0, -1).join("/");
};

const resolveParentIRI = (
  path: string[],
  pathToIRI: Map<string, string>,
  rootIRI?: string,
): string | undefined => {
  const parentKey = parentPathKey(path);
  if (parentKey === undefined) return undefined;
  if (parentKey === "") return rootIRI;
  return pathToIRI.get(parentKey) ?? rootIRI;
};

const longestStrictPrefixPath = (
  childPathKey: string,
  pathToIRI: Map<string, string>,
): string | undefined => {
  let longest: string | undefined;
  for (const prefixPath of pathToIRI.keys()) {
    if (prefixPath === childPathKey) continue;
    if (childPathKey.startsWith(`${prefixPath}/`)) {
      if (!longest || prefixPath.length > longest.length) {
        longest = prefixPath;
      }
    }
  }
  return longest;
};

const reparentFallbackChildren = (
  changeSet: StagedChangeSet,
  iriToPath: Map<string, string[]>,
  pathToIRI: Map<string, string>,
  parentPathKey: string,
  parentIRI: string,
  rootIRI: string | undefined,
): void => {
  if (!rootIRI) return;
  const prefix = `${parentPathKey}/`;
  for (const entity of changeSet.list()) {
    const childPath = iriToPath.get(entity.entityIRI);
    if (!childPath) continue;
    const childPathKey = pathKey(childPath);
    if (!childPathKey.startsWith(prefix)) continue;
    if (entity.parentIRI !== rootIRI) continue;
    const longest = longestStrictPrefixPath(childPathKey, pathToIRI);
    if (longest === parentPathKey) {
      changeSet.reparent(entity.entityIRI, parentIRI);
    }
  }
};

const readIdAuthority = (
  document: Record<string, unknown>,
): { authority: string; id: string } | null => {
  const idAuthority = document.idAuthority;
  if (!idAuthority || typeof idAuthority !== "object") return null;
  const authority = (idAuthority as { authority?: string }).authority;
  const id = (idAuthority as { id?: string }).id;
  if (typeof authority !== "string" || typeof id !== "string") return null;
  return { authority, id };
};

const labelFromDocument = (
  document: Record<string, unknown>,
  typeIRI: string,
  typeIRItoTypeName: IRIToStringFn,
  primaryFields: PrimaryFieldDeclaration,
): string | null => {
  const typeName = typeIRItoTypeName(typeIRI);
  const labelField = primaryFields[typeName]?.label ?? "title";
  const value = document[labelField];
  return typeof value === "string" && value.length > 0 ? value : null;
};

const findStagedByAuthority = (
  changeSet: StagedChangeSet,
  secondaryIRI: string,
  authorityIRI: string,
  typeIRI: string,
): string | null => {
  for (const entity of changeSet.list()) {
    if (entity.typeIRI !== typeIRI) continue;
    const idAuthority = readIdAuthority(entity.document);
    if (
      idAuthority?.authority === authorityIRI &&
      idAuthority.id === secondaryIRI
    ) {
      return entity.entityIRI;
    }
  }
  return null;
};

const findStagedByLabel = (
  changeSet: StagedChangeSet,
  label: string,
  typeIRI: string,
  typeIRItoTypeName: IRIToStringFn,
  primaryFields: PrimaryFieldDeclaration,
): string | null => {
  const normalized = label.trim().toLowerCase();
  for (const entity of changeSet.list()) {
    if (entity.typeIRI !== typeIRI) continue;
    const entityLabel = labelFromDocument(
      entity.document,
      typeIRI,
      typeIRItoTypeName,
      primaryFields,
    );
    if (entityLabel?.trim().toLowerCase() === normalized) {
      return entity.entityIRI;
    }
  }
  return null;
};

type ProbeResult = {
  iri: string | null;
  matchMethod?: StrategyTrace["matchMethod"];
  probedAgainst?: StrategyTrace["probedAgainst"];
};

export const makeStagingStrategyContext = (
  opts: MakeStagingStrategyContextOptions,
): StrategyContext => {
  const {
    changeSet,
    mainStore,
    mappingId,
    sourceRef,
    schemaVersion,
    mappingVersion,
    rootIRI,
    createEntityIRI,
    typeIRItoTypeName,
    primaryFields,
    authorityAccess,
    normDataMappings,
    disableLogging = true,
  } = opts;

  const pathToIRI = new Map<string, string>();
  const iriToPath = new Map<string, string[]>();
  let pendingTrace: Partial<StrategyTrace> | undefined;

  const stubStore = {
    findDocumentsByAuthorityIRI: mainStore?.findDocumentsByAuthorityIRI,
    searchByLabel: mainStore?.searchByLabel,
  };

  const baseContext = makeDefaultMappingStrategyContext(
    stubStore as Parameters<typeof makeDefaultMappingStrategyContext>[0],
    createEntityIRI,
    typeIRItoTypeName,
    primaryFields,
    normDataMappings,
    authorityAccess,
    disableLogging,
  );

  const probeSameAs = async (
    secondaryIRI: string,
    authorityIRI: string,
    typeIRI?: string,
  ): Promise<ProbeResult> => {
    if (!typeIRI) return { iri: null, matchMethod: "none" };

    const staged = findStagedByAuthority(
      changeSet,
      secondaryIRI,
      authorityIRI,
      typeIRI,
    );
    if (staged) {
      return {
        iri: staged,
        matchMethod: "sameAs",
        probedAgainst: ["staged"],
      };
    }

    const typeName = typeIRItoTypeName(typeIRI);
    const finder = mainStore?.findDocumentsByAuthorityIRI;
    if (finder) {
      const ids = await finder(typeName, secondaryIRI, authorityIRI);
      if (ids.length > 0) {
        return {
          iri: ids[0] ?? null,
          matchMethod: "sameAs",
          probedAgainst: ["main"],
        };
      }
    }

    return {
      iri: null,
      matchMethod: "none",
      probedAgainst: ["staged", "main"],
    };
  };

  const probeLabel = async (
    label: string,
    typeIRI: string,
  ): Promise<ProbeResult> => {
    const staged = findStagedByLabel(
      changeSet,
      label,
      typeIRI,
      typeIRItoTypeName,
      primaryFields,
    );
    if (staged) {
      return {
        iri: staged,
        matchMethod: "label",
        probedAgainst: ["staged"],
      };
    }

    const typeName = typeIRItoTypeName(typeIRI);
    const searcher = mainStore?.searchByLabel;
    if (searcher) {
      const docs = await searcher(typeName, label, 10);
      const first = docs[0] as { ["@id"]?: string } | undefined;
      if (typeof first?.["@id"] === "string") {
        return {
          iri: first["@id"],
          matchMethod: "label",
          probedAgainst: ["main"],
        };
      }
    }

    return {
      iri: null,
      matchMethod: "none",
      probedAgainst: ["staged", "main"],
    };
  };

  const resolveParent = (path: string[]): string | undefined =>
    resolveParentIRI(path, pathToIRI, rootIRI);

  const augmentContext = (context: StrategyContext): StrategyContext => ({
    ...context,
    getPrimaryIRIBySecondaryIRI: async (
      secondaryIRI,
      authorityIRI,
      typeIRI,
    ) => {
      const result = await probeSameAs(secondaryIRI, authorityIRI, typeIRI);
      if (result.iri) {
        pendingTrace = {
          decision: "matched-existing",
          matchMethod: result.matchMethod,
          probedAgainst: result.probedAgainst,
        };
      }
      return result.iri;
    },
    searchEntityByLabel: async (label, typeIRI) => {
      const result = await probeLabel(label, typeIRI);
      if (result.iri) {
        pendingTrace = {
          decision: "matched-existing",
          matchMethod: result.matchMethod,
          probedAgainst: result.probedAgainst,
        };
      }
      return result.iri;
    },
    onNewDocument: async (document: Record<string, unknown>) => {
      const entityIRI = document["@id"];
      const typeIRI = document["@type"];
      if (typeof entityIRI !== "string" || typeof typeIRI !== "string") {
        // The upstream createEntity* strategies pass an empty object when an
        // authority record was fetched but could not be mapped (missing
        // mapping config or a nested mapping error). Skip it instead of
        // aborting the whole import; returning null drops the element.
        console.warn(
          "onNewDocument: skipping document without @id/@type",
          document,
        );
        return null;
      }

      const currentPath = context.path;
      const parentIRI = resolveParent(currentPath);
      const currentPathKey = pathKey(currentPath);

      const trace: StrategyTrace = {
        strategyId: pendingTrace?.strategyId,
        mappingPath: [...currentPath],
        decision: pendingTrace?.decision ?? "created",
        matchMethod: pendingTrace?.matchMethod,
        probedAgainst: pendingTrace?.probedAgainst,
        note: pendingTrace?.note,
      };
      pendingTrace = undefined;

      await changeSet.stage({
        entityIRI,
        typeIRI,
        document,
        parentIRI,
        depth: currentPath.length,
        provenance: {
          method: "mapping",
          mappingId,
          mappingVersion,
          schemaVersion,
          sourceRef,
          timestamp: new Date().toISOString(),
        },
        trace,
      });

      pathToIRI.set(currentPathKey, entityIRI);
      iriToPath.set(entityIRI, [...currentPath]);
      reparentFallbackChildren(
        changeSet,
        iriToPath,
        pathToIRI,
        currentPathKey,
        entityIRI,
        rootIRI,
      );

      return {
        "@id": entityIRI,
        "@type": typeIRI,
      };
    },
    createDeeperContext: (innerCtx, pathElement, currentMapping) =>
      augmentContext(
        context.createDeeperContext(innerCtx, pathElement, currentMapping),
      ),
  });

  return augmentContext(baseContext);
};
