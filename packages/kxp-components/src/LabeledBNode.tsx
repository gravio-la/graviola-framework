import type { BlankNode } from "@rdfjs/types";
import { findFirstInProps } from "@graviola/edb-graph-traversal";
import { useMemo } from "react";
import { dcterms, foaf, rdfs, skos } from "@tpluscode/rdf-ns-builders";
import { geonames, radatana } from "@graviola/edb-marc-to-rdf";
import {
  Button,
  styled,
  Tooltip,
  tooltipClasses,
  TooltipProps,
} from "@mui/material";

import { KXPAllPropTable } from "./KXPAllPropTable";
import type { NodePropertyTree } from "@graviola/edb-global-types";
import type { FC } from "react";

const LightTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.common.white,
    color: "rgba(0, 0, 0, 0.87)",
    boxShadow: theme.shadows[1],
    fontSize: 11,
  },
}));
export const LabeledBNode: FC<{
  bnode: BlankNode;
  properties: NodePropertyTree;
}> = ({ bnode, properties }) => {
  const label = useMemo(
    () =>
      findFirstInProps(
        properties,
        foaf.name,
        dcterms.title,
        skos.prefLabel,
        rdfs.label,
        radatana.catalogueName,
        geonames("name"),
      ),
    [properties],
  );
  return (
    <LightTooltip
      title={
        <>
          <KXPAllPropTable entry={{ id: bnode.value, properties }} />
        </>
      }
    >
      <Button>{label || bnode.value}</Button>
    </LightTooltip>
  );
};
