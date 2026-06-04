import React from "react";

import { SemanticViewCore } from "./SemanticViewCore";
import { useEntity } from "@graviola/edb-state-hooks";
import type { SemanticViewNoOpsProps, SemanticViewProps } from "./types";

export function SemanticDetailViewNoOps(props: SemanticViewNoOpsProps) {
  return <SemanticViewCore viewSize="detail" {...props} />;
}

export function SemanticDetailView({
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
    <SemanticDetailViewNoOps
      data={document}
      typeIRI={typeIRI}
      typeName={typeName}
      isLoading={loadQuery.isLoading}
      entityIRI={entityIRI}
      motionId={entityIRI}
      {...rest}
    />
  );
}
