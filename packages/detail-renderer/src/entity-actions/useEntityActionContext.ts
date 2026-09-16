import { useMemo } from "react";
import type { JSONSchema7 } from "json-schema";
import type {
  ActionSurface,
  EntityActionContext,
  EntityActionTarget,
} from "@graviola/edb-detail-renderer-core";
import {
  useDispatchIntent,
  useHostCapabilities,
  useViewDensity,
} from "@graviola/edb-state-hooks";

export function useEntityActionContext(params: {
  surface: ActionSurface;
  schema: JSONSchema7;
  targets: EntityActionTarget[];
  typeName?: string;
  typeIRI?: string;
}): EntityActionContext {
  const { surface, schema, targets, typeName, typeIRI } = params;
  const capabilities = useHostCapabilities();
  const { density } = useViewDensity();
  const dispatchIntent = useDispatchIntent();
  return useMemo(
    () => ({
      surface,
      density,
      rootSchema: schema,
      typeName,
      typeIRI,
      targets,
      capabilities,
      dispatchIntent: (intent) => Promise.resolve(dispatchIntent(intent)),
    }),
    [
      surface,
      density,
      schema,
      typeName,
      typeIRI,
      targets,
      capabilities,
      dispatchIntent,
    ],
  );
}
