import React from "react";

import { SemanticViewCore } from "./SemanticViewCore";
import { useEntity } from "@graviola/edb-state-hooks";
import type { SemanticViewNoOpsProps, SemanticViewProps } from "./types";

export function SemanticCardNoOps(props: SemanticViewNoOpsProps) {
  return <SemanticViewCore viewSize="card" {...props} />;
}

export function SemanticCard({
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
    <SemanticCardNoOps
      data={document}
      typeIRI={typeIRI}
      typeName={typeName}
      isLoading={loadQuery.isLoading}
      motionId={entityIRI}
      {...rest}
    />
  );
}
