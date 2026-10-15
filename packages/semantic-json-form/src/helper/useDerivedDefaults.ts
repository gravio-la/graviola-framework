import type { DerivedDefaultsConfig } from "@graviola/edb-core-types";
import {
  applyDerivedDefault,
  classNameFromObjectSchema,
  planDerivedDefaultJobs,
  pruneAutoFilledPaths,
  resolveDerivedPathValue,
  resolveSchemaRef,
  shouldApplyDerivedDefault,
} from "@graviola/edb-core-utils";
import { useAdbContext, useDataStore } from "@graviola/edb-state-hooks";
import type { DerivedDefaultHintContextValue } from "@graviola/edb-linked-data-renderer";
import get from "lodash-es/get";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import type { JSONSchema7 } from "json-schema";

function propertyTitle(
  rootSchema: JSONSchema7,
  ownerSchema: JSONSchema7 | undefined,
  segment: string,
): string {
  const resolved = resolveSchemaRef(rootSchema, ownerSchema);
  const prop = resolved?.properties?.[segment];
  if (!prop || typeof prop === "boolean") {
    return segment;
  }
  const title = (prop as JSONSchema7).title;
  return typeof title === "string" && title.length > 0 ? title : segment;
}

export function useDerivedDefaults(options: {
  schema: JSONSchema7 | undefined;
  config: DerivedDefaultsConfig | undefined;
  onChange: (data: Record<string, unknown>) => void;
  latestDataRef: MutableRefObject<Record<string, unknown>>;
}) {
  const { schema, config, onChange, latestDataRef } = options;
  const { typeIRIToTypeName } = useAdbContext();
  const { dataStore } = useDataStore();

  const autoFilledRef = useRef(new Map<string, unknown>());
  const hintMetaRef = useRef(new Map<string, { sourceTitle: string }>());
  const jobTokensRef = useRef(new Map<string, number>());
  const tokenCounterRef = useRef(0);
  const loadCacheRef = useRef(new Map<string, Record<string, unknown>>());
  const [autoFilledPaths, setAutoFilledPaths] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const syncAutoFilledPaths = useCallback(() => {
    setAutoFilledPaths(new Set(autoFilledRef.current.keys()));
  }, []);

  const classOf = useCallback(
    (objectSchema: JSONSchema7 | undefined) => {
      if (!schema) {
        return undefined;
      }
      return classNameFromObjectSchema(schema, objectSchema, typeIRIToTypeName);
    },
    [schema, typeIRIToTypeName],
  );

  const hintContextValue = useMemo((): DerivedDefaultHintContextValue => {
    return {
      autoFilledPaths,
      entryForPath: (path: string) => hintMetaRef.current.get(path),
    };
  }, [autoFilledPaths]);

  const onUserChange = useCallback(
    (prev: Record<string, unknown>, next: Record<string, unknown>) => {
      if (!schema || !config || Object.keys(config).length === 0) {
        return next;
      }

      pruneAutoFilledPaths(prev, next, autoFilledRef.current);
      syncAutoFilledPaths();

      const jobs = planDerivedDefaultJobs(prev, next, schema, config, classOf);

      for (const job of jobs) {
        const token = ++tokenCounterRef.current;
        jobTokensRef.current.set(job.targetPath, token);

        void (async () => {
          const resolved = await resolveDerivedPathValue({
            rootSchema: schema,
            ownerSchema: job.ownerObjectSchema,
            sourceSegment: job.sourceSegment,
            firstValue: job.firstValue,
            restPath: job.restPath,
            typeIRIToTypeName,
            cache: loadCacheRef.current,
            loadDocument: async (typeName, iri) => {
              if (!dataStore?.loadOne) {
                return null;
              }
              const loaded = await dataStore.loadOne(typeName, iri);
              if (!loaded || typeof loaded !== "object") {
                return null;
              }
              if ("document" in loaded) {
                const doc = (loaded as { document?: unknown }).document;
                return doc && typeof doc === "object"
                  ? (doc as Record<string, unknown>)
                  : null;
              }
              return loaded as Record<string, unknown>;
            },
          });

          if (jobTokensRef.current.get(job.targetPath) !== token) {
            return;
          }

          if (resolved === undefined) {
            return;
          }

          const latest = latestDataRef.current;
          const currentTarget = get(latest, job.targetPath);
          const previousAuto = autoFilledRef.current.get(job.targetPath);

          if (!shouldApplyDerivedDefault(currentTarget, previousAuto)) {
            return;
          }

          autoFilledRef.current.set(job.targetPath, resolved);
          hintMetaRef.current.set(job.targetPath, {
            sourceTitle: propertyTitle(
              schema,
              job.ownerObjectSchema,
              job.sourceSegment,
            ),
          });

          const patched = applyDerivedDefault(latest, job.targetPath, resolved);
          latestDataRef.current = patched;
          syncAutoFilledPaths();
          onChange(patched);
        })();
      }

      return next;
    },
    [
      schema,
      config,
      classOf,
      typeIRIToTypeName,
      dataStore,
      latestDataRef,
      onChange,
      syncAutoFilledPaths,
    ],
  );

  return {
    onUserChange,
    hintContextValue,
  };
}
