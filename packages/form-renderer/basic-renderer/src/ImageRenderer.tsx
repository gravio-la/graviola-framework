import { ControlProps } from "@jsonforms/core";
import { withJsonFormsControlProps } from "@jsonforms/react";
import { useThumbnailUrl } from "@graviola/edb-state-hooks";
import { Edit as EditIcon, ImageNotSupported } from "@mui/icons-material";
import {
  Box,
  FormControl,
  IconButton,
  Paper,
  TextField,
  Tooltip,
  useTheme,
} from "@mui/material";
import merge from "lodash-es/merge";
import { useTranslation } from "next-i18next";
import { useCallback, useState } from "react";

const ImageRendererComponent = (props: ControlProps) => {
  const {
    id,
    errors,
    schema,
    uischema,
    visible,
    required,
    config,
    data,
    handleChange,
    path,
  } = props;
  const isValid = errors.length === 0;
  const { t } = useTranslation();
  const theme = useTheme();
  const appliedUiSchemaOptions = merge({}, config, uischema.options);
  const [editMode, setEditMode] = useState(false);
  const imageSrc = useThumbnailUrl(
    typeof data === "string" ? data : undefined,
    { sizeCategory: "detail" },
  );

  const handleChange_ = useCallback(
    (v?: string) => {
      handleChange(path, v);
    },
    [path, handleChange],
  );

  if (!visible) {
    return null;
  }

  return (
    <Box>
      <FormControl
        fullWidth={!appliedUiSchemaOptions.trim}
        id={id}
        sx={(theme) => ({ marginBottom: theme.spacing(2) })}
      >
        <Box
          sx={{
            position: "relative",
            width: "100%",
            height: "300px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor:
              theme.palette.mode === "dark" ? "grey.900" : "grey.100",
            border: `2px dashed ${theme.palette.mode === "dark" ? "grey.700" : "grey.400"}`,
            borderRadius: 1,
            overflow: "hidden",
          }}
        >
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={typeof data === "string" ? data : ""}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
            />
          ) : (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1,
              }}
            >
              <ImageNotSupported
                sx={{ fontSize: 40, color: "text.secondary" }}
              />
              <Box sx={{ color: "text.secondary" }}>
                {t("No image selected")}
              </Box>
            </Box>
          )}
          <Tooltip
            open={editMode}
            title={
              <Paper
                elevation={3}
                sx={{
                  p: 1,
                  backgroundColor: "background.paper",
                }}
              >
                <TextField
                  label={schema.title || t("image url")}
                  onChange={(e) => handleChange_(e.target.value)}
                  value={data || ""}
                  fullWidth={true}
                  size="small"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setEditMode(false);
                    }
                  }}
                />
              </Paper>
            }
            placement="top"
            arrow
            PopperProps={{
              sx: {
                "& .MuiTooltip-tooltip": {
                  backgroundColor: "transparent",
                  p: 0,
                },
                "& .MuiTooltip-arrow": {
                  color: "background.paper",
                },
              },
              modifiers: [
                {
                  name: "offset",
                  options: {
                    offset: [0, 8],
                  },
                },
                {
                  name: "preventOverflow",
                  options: {
                    padding: 8,
                  },
                },
              ],
            }}
          >
            <IconButton
              onClick={() => setEditMode((prev) => !prev)}
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                backgroundColor: "background.paper",
                border: "1px solid",
                borderColor: "divider",
                "&:hover": {
                  backgroundColor: "action.hover",
                },
              }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </FormControl>
    </Box>
  );
};

export const ImageRenderer = withJsonFormsControlProps(ImageRendererComponent);
