import { SemanticCard } from "@graviola/semantic-views";
import type { PrimaryFieldResults } from "@graviola/edb-core-types";
import type { CardProps } from "@mui/material";

export type EntityDetailCardProps = {
  typeIRI: string;
  entityIRI: string;
  data?: any;
  cardInfo?: PrimaryFieldResults<string>;
  readonly?: boolean;
  tableProps?: Record<string, unknown>;
  cardProps?: CardProps;
};

/** Convenience wrapper around {@link SemanticCard}. */
export const EntityDetailCard = ({
  entityIRI,
  typeIRI,
  data,
  cardProps,
}: EntityDetailCardProps) => (
  <SemanticCard
    entityIRI={entityIRI}
    typeIRI={typeIRI}
    defaultData={data}
    disableLoad={Boolean(data)}
    {...cardProps}
  />
);
