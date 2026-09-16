import { serializeEntityRef, type EntityRef } from "@graviola/entity-ref-core";
import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Typography,
} from "@mui/material";
import groupBy from "lodash-es/groupBy";

import { useEntitySuggest } from "./suggest/EntitySuggestContext";
import type { EntitySuggestCandidate } from "./types";

export type EntitySuggestPopoverProps = {
  query: string;
  open: boolean;
  onSelect: (candidate: EntitySuggestCandidate, markdown: string) => void;
  anchorWidth?: number;
  syntax?: "uri" | "wikilink";
};

export function EntitySuggestPopover({
  query,
  open,
  onSelect,
  anchorWidth = 360,
  syntax = "uri",
}: EntitySuggestPopoverProps) {
  const { data = [], isFetching } = useEntitySuggest(query, { limit: 12 });

  if (!open || !query.trim()) {
    return null;
  }

  const grouped = groupBy(data, (c: EntitySuggestCandidate) => c.typeName);

  const handleSelect = (candidate: EntitySuggestCandidate) => {
    const ref: EntityRef = {
      typeName: candidate.typeName,
      entityId: candidate.entityIRI.split("/").pop() ?? candidate.entityIRI,
      entityIRI: candidate.entityIRI,
      label: candidate.label,
      view: "chip",
    };
    onSelect(candidate, serializeEntityRef(ref, { syntax }));
  };

  return (
    <Paper
      elevation={4}
      sx={{
        position: "absolute",
        zIndex: 1400,
        mt: 0.5,
        width: anchorWidth,
        maxHeight: 280,
        overflow: "auto",
      }}
    >
      {isFetching && data.length === 0 ? (
        <Box sx={{ p: 1.5 }}>
          <Typography variant="body2" color="text.secondary">
            Searching…
          </Typography>
        </Box>
      ) : data.length === 0 ? (
        <Box sx={{ p: 1.5 }}>
          <Typography variant="body2" color="text.secondary">
            No entities found
          </Typography>
        </Box>
      ) : (
        Object.entries(grouped).map(([typeName, items]) => (
          <Box key={typeName}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ px: 1.5, pt: 1, display: "block" }}
            >
              {typeName}
            </Typography>
            <List dense disablePadding>
              {(items as EntitySuggestCandidate[]).map((item) => (
                <ListItemButton
                  key={item.entityIRI}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(item)}
                >
                  <ListItemText
                    primary={item.label}
                    secondary={item.entityIRI}
                  />
                </ListItemButton>
              ))}
            </List>
          </Box>
        ))
      )}
    </Paper>
  );
}
