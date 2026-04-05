import type { CRUDFunctions } from "@graviola/edb-core-types";
import { useAdbContext } from "@graviola/edb-state-hooks";
import React, { FunctionComponent } from "react";

import YasguiSPARQLEditor from "./YasguiSPARQLEditor";

export type SPARQLLocalOxigraphToolkitProps = {
  /** Full SPARQL CRUD layer; YASQE Run query executes through these functions. */
  sparqlCrud?: CRUDFunctions | null;
};

export const SPARQLLocalOxigraphToolkit: FunctionComponent<
  SPARQLLocalOxigraphToolkitProps
> = ({ sparqlCrud }) => {
  const { queryBuildOptions } = useAdbContext();
  const prefixes = queryBuildOptions?.prefixes;

  return (
    <YasguiSPARQLEditor
      containerId="yasgui-local-oxigraph-toolkit"
      prefixes={prefixes}
      sparqlCrud={sparqlCrud ?? null}
    />
  );
};
