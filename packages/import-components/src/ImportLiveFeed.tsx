import {
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import type { PrimaryFieldDeclaration } from "@graviola/edb-core-types";
import type { IRIToStringFn } from "@graviola/edb-core-types";
import type { StagedEntity } from "@graviola/edb-import-staging";
import { labelForEntity } from "./helpers";

export type ImportFeedItem = {
  id: string;
  kind: "staged" | "updated";
  entity: StagedEntity;
};

type ImportLiveFeedProps = {
  feedItems: ImportFeedItem[];
  typeIRItoTypeName: IRIToStringFn;
  primaryFields: PrimaryFieldDeclaration;
  maxHeight?: number;
};

export function ImportLiveFeed({
  feedItems,
  typeIRItoTypeName,
  primaryFields,
  maxHeight = 200,
}: ImportLiveFeedProps) {
  if (feedItems.length === 0) return null;

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Live creation feed
      </Typography>
      <List
        dense
        sx={{
          maxHeight,
          overflow: "auto",
          border: 1,
          borderColor: "divider",
          borderRadius: 1,
        }}
      >
        {feedItems.map((item) => {
          const typeName = typeIRItoTypeName(item.entity.typeIRI);
          const label = labelForEntity(
            item.entity,
            typeIRItoTypeName,
            primaryFields,
          );
          return (
            <ListItem key={item.id} sx={{ pl: 2 + item.entity.depth * 2 }}>
              <ListItemText
                primary={
                  <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                    <Typography variant="body2" component="span">
                      {item.kind === "staged" ? "staged" : "updated"} {typeName}{" "}
                      {label}
                    </Typography>
                    <Chip label={typeName} size="small" />
                  </Box>
                }
              />
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
}
