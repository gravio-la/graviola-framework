import {
  inferTypeNameFromIRI,
  resolveEntityIRI,
  type EntityEmbedView,
  type EntityRef,
} from "@graviola/entity-ref-core";
import { useAdbContext } from "@graviola/edb-state-hooks";
import { useMemo } from "react";

import { defaultEntityEmbedRegistry } from "./registry";
import type { EntityEmbedRegistry } from "./types";

export type EntityRefViewComponentProps = {
  ref: EntityRef;
  registry?: EntityEmbedRegistry;
  defaultView?: EntityEmbedView;
};

export function EntityRefView({
  ref: entityRef,
  registry = defaultEntityEmbedRegistry,
  defaultView = "chip",
}: EntityRefViewComponentProps) {
  const adb = useAdbContext();
  const resolveCtx = useMemo(
    () => ({
      baseIRI: adb.env.baseIRI,
      entityBaseIRI: adb.env.baseIRI,
      typeNameToTypeIRI: adb.typeNameToTypeIRI,
    }),
    [adb],
  );

  const entityIRI = resolveEntityIRI(entityRef, resolveCtx);
  const typeName =
    entityRef.typeName ??
    inferTypeNameFromIRI(entityIRI, resolveCtx) ??
    undefined;
  const typeIRI = typeName ? adb.typeNameToTypeIRI(typeName) : undefined;
  const view = entityRef.view ?? defaultView;
  const Renderer = registry[view] ?? registry.chip ?? registry.inline;

  if (!Renderer) {
    return <span>{entityRef.label ?? entityRef.entityId}</span>;
  }

  return (
    <Renderer
      ref={entityRef}
      entityIRI={entityIRI}
      typeName={typeName}
      typeIRI={typeIRI}
      label={entityRef.label}
      view={view}
    />
  );
}
