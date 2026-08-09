import { ArrowBack } from "@mui/icons-material";
import { useThumbnailUrl } from "@graviola/edb-state-hooks";
import {
  Box,
  BoxProps,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  IconButton,
  Typography,
} from "@mui/material";
import React, { FunctionComponent } from "react";

export type EntityCardData = Partial<{
  id: string;
  label: string;
  title: string;
  name: string;
  description: string;
  avatar: string;
  allProps: any;
}>;

type Props = {
  data: EntityCardData;
  id: string;
  onBack?: () => void;
  detailView?: React.ReactNode;
  cardActionChildren?: React.ReactNode;
};

export type ClassicEntityCardProps = Props & Partial<BoxProps>;

export const ClassicEntityCard: FunctionComponent<ClassicEntityCardProps> = ({
  data,
  id,
  onBack,
  cardActionChildren,
  detailView,
  ...rest
}) => {
  const _label = data.label || data.title || data.name || id;
  const avatarSrc = useThumbnailUrl(
    data.avatar,
    { sizeCategory: "detail" },
    {
      entityIRI: id,
    },
  );

  return (
    <Box {...rest}>
      {onBack && (
        <IconButton onClick={onBack}>
          <ArrowBack />
        </IconButton>
      )}
      <Card>
        {avatarSrc && (
          <CardMedia
            component="img"
            alt={"Image of " + _label}
            height="300"
            image={avatarSrc}
          />
        )}
        <CardContent>
          <Typography gutterBottom variant="h5" component="div">
            {_label}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {data.description}
          </Typography>
        </CardContent>
        {cardActionChildren && <CardActions>{cardActionChildren}</CardActions>}
        {detailView || null}
      </Card>
    </Box>
  );
};
