import React from "react";

import { SemanticViewCore } from "./SemanticViewCore";
import { useEntity } from "@graviola/edb-state-hooks";
import type { SemanticViewNoOpsProps, SemanticViewProps } from "./types";

export function SemanticListItemNoOps(props: SemanticViewNoOpsProps) {
  return <SemanticViewCore viewSize="listItem" {...props} />;
}

export function SemanticListItem({
  entityIRI,
  typeIRI,
  typeName,
  defaultData,
  disableLoad,
  loadQueryKey,
  ...rest
}: SemanticViewProps) {
  const { loadQuery } = useEntity({
    entityIRI,
    typeIRI,
    typeName,
    defaultData,
    disableLoad,
    loadQueryKey,
  });
  const document = loadQuery.data?.document ?? defaultData;
  return (
    <SemanticListItemNoOps
      data={document}
      typeIRI={typeIRI}
      typeName={typeName}
      isLoading={loadQuery.isLoading}
      motionId={entityIRI}
      {...rest}
    />
  );
}
