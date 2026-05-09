import { PrimaryFieldResults } from "@graviola/edb-core-types";
import {
  Card,
  CardActions,
  CardContent,
  CardMedia,
  CardProps,
  Typography,
} from "@mui/material";
import isString from "lodash-es/isString";
import React, { FunctionComponent } from "react";

import { AllPropTableProps, AllPropTable } from "./AllPropsTable";

type OwnProps = {
  typeIRI: string;
  entityIRI: string;
  readonly?: boolean;
  cardInfo: PrimaryFieldResults<string>;
  cardActionChildren?: React.ReactNode;
  data: any;
  tableProps?: Partial<AllPropTableProps>;
  cardProps?: CardProps;
};

export type EntityDetailCardProps = OwnProps;
export const EntityDetailCard: FunctionComponent<EntityDetailCardProps> = ({
  cardInfo,
  data,
  cardActionChildren,
  tableProps,
  cardProps,
}) => {
  return (
    <>
      <Card {...(cardProps ?? {})}>
        {cardInfo.image && (
          <CardMedia
            component="img"
            sx={{
              width: "100%",
              maxHeight: "14em",
              objectFit: "cover",
              display: "block",
            }}
            image={cardInfo.image}
            alt={cardInfo.label ?? ""}
          />
        )}
        <CardContent>
          <Typography
            gutterBottom
            variant="h5"
            component="div"
            sx={{ fontWeight: "bold" }}
          >
            {cardInfo.label}
          </Typography>
          {isString(data?.originalTitle) ||
            isString(data?.subtitle) ||
            (cardInfo.description?.length < 300 && (
              <Typography variant="body2" color="text.secondary">
                {data?.subtitle || data?.originalTitle || cardInfo.description}
              </Typography>
            ))}
        </CardContent>
        {cardActionChildren && <CardActions>{cardActionChildren}</CardActions>}
      </Card>
      <AllPropTable
        allProps={data}
        disableContextMenu
        inlineEditing={true}
        {...(tableProps ?? {})}
      />
    </>
  );
};
