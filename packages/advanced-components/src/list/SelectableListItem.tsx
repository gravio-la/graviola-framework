import {
  Avatar,
  Checkbox,
  IconButton,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemButtonProps,
  ListItemText,
  Typography,
  Box,
} from "@mui/material";
import { Delete, Edit } from "@mui/icons-material";
import { useThumbnailUrl } from "@graviola/edb-state-hooks";
import { withEllipsis } from "@graviola/edb-ui-utils";
import React, { ReactNode } from "react";

export type SelectableListItemProps = {
  id: string;
  primary: string;
  secondary?: string;
  description?: string;
  avatar?: string;
  index: number;
  selected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClickEntity?: (id: string) => void;
  actionTools?: ReactNode;
  listItemButtonProps?: ListItemButtonProps;
};

export const SelectableListItem: React.FC<SelectableListItemProps> = ({
  id,
  primary,
  secondary,
  description,
  avatar,
  index,
  selected = false,
  onSelect,
  onEdit,
  onDelete,
  onClickEntity,
  actionTools,
  listItemButtonProps = {},
}) => {
  const avatarSrc = useThumbnailUrl(
    avatar,
    { sizeCategory: "listItem" },
    {
      entityIRI: id,
    },
  );
  const handleSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onSelect) {
      onSelect(id, event.target.checked);
    }
  };

  const defaultActionTools = (
    <Box>
      {onEdit && (
        <IconButton onClick={() => onEdit(id)} size="small" color="primary">
          <Edit />
        </IconButton>
      )}
      {onDelete && (
        <IconButton onClick={() => onDelete(id)} size="small" color="error">
          <Delete />
        </IconButton>
      )}
    </Box>
  );

  return (
    <ListItem
      secondaryAction={actionTools || defaultActionTools}
      disablePadding
    >
      {onSelect && (
        <Checkbox
          edge="start"
          checked={selected}
          onChange={handleSelect}
          sx={{ ml: 1 }}
        />
      )}
      <ListItemButton
        {...listItemButtonProps}
        onClick={() => onClickEntity?.(id)}
      >
        <ListItemAvatar>
          <Avatar variant="rounded" aria-label="Index" src={avatarSrc}>
            {index + 1}
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={primary}
          secondary={
            <>
              <Typography
                sx={{ display: "inline" }}
                component="span"
                variant="body2"
                color="text.primary"
              >
                {withEllipsis(secondary, 50)}
              </Typography>
              {withEllipsis(description, 100)}
            </>
          }
        />
      </ListItemButton>
    </ListItem>
  );
};
