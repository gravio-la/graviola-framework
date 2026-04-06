import { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { entityIRIFromRoute } from "./entityIRIFromRoute";
import type { SchemaRouteOutletContext } from "./schemaOutletContext";

export function useEntityIRIFromEntityID(
  entityID: string | undefined,
): string | undefined {
  const { schemaConfig } = useOutletContext<SchemaRouteOutletContext>();
  return useMemo(
    () => entityIRIFromRoute(schemaConfig.entityBaseIRI, entityID),
    [entityID, schemaConfig.entityBaseIRI],
  );
}
