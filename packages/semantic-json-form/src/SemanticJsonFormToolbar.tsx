import { IconButton, Toolbar, Button, ButtonGroup, Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  DangerousOutlined,
  Delete,
  Edit,
  EditOff,
  OpenInNew,
  Refresh,
  Save,
} from "@mui/icons-material";
import React from "react";
import { useTranslation } from "next-i18next";

const ResponsiveButton = styled(Button)(({ theme }) => ({
  flexDirection: "column",
  gap: theme.spacing(0.5),
  minWidth: "auto",
  paddingLeft: theme.spacing(1),
  paddingRight: theme.spacing(1),
  [theme.breakpoints.up("sm")]: {
    flexDirection: "row",
    gap: theme.spacing(1),
    minWidth: "64px",
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
  },
}));

type SemanticJsonFormsToolbarProps = {
  editMode: boolean;
  onEditModeToggle?: () => void;
  onSave?: () => void;
  onRemove?: () => void;
  onReload?: () => void;
  onReset?: () => void;
  onShow?: () => void;
  children?: React.ReactNode;
  sticky?: boolean;
  showLabels?: boolean;
};
export const SemanticJsonFormToolbar = ({
  editMode,
  onEditModeToggle,
  onReset,
  onSave,
  onRemove,
  onReload,
  onShow,
  children,
  sticky = false,
  showLabels = false,
}: SemanticJsonFormsToolbarProps) => {
  const { t } = useTranslation();

  return (
    <Toolbar
      sx={{
        p: 0,
        "&.MuiToolbar-root": { padding: 0 },
        borderBottom: (theme) => "1px solid " + theme.palette.divider,
        position: sticky ? "sticky" : "static",
        top: sticky ? 0 : "auto",
        zIndex: sticky ? (theme) => theme.zIndex.appBar : "auto",
        backgroundColor: sticky
          ? (theme) => theme.palette.background.paper
          : "transparent",
        marginBottom: 2,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
        {/* Main actions (left side) */}
        <ButtonGroup variant={showLabels ? "outlined" : "text"} size="small">
          {showLabels ? (
            <ResponsiveButton onClick={onShow} variant="outlined" size="small">
              <OpenInNew fontSize="small" />
              <Box component="span" sx={{ fontSize: "0.75rem" }}>
                {t("show")}
              </Box>
            </ResponsiveButton>
          ) : (
            <IconButton onClick={onShow}>
              <OpenInNew />
            </IconButton>
          )}
          {onEditModeToggle &&
            (showLabels ? (
              <ResponsiveButton
                onClick={onEditModeToggle}
                variant="outlined"
                size="small"
              >
                {editMode ? (
                  <EditOff fontSize="small" />
                ) : (
                  <Edit fontSize="small" />
                )}
                <Box component="span" sx={{ fontSize: "0.75rem" }}>
                  {editMode ? t("exit-edit") : t("edit")}
                </Box>
              </ResponsiveButton>
            ) : (
              <IconButton onClick={onEditModeToggle}>
                {editMode ? <EditOff /> : <Edit />}
              </IconButton>
            ))}
          {editMode && (
            <>
              {onSave &&
                (showLabels ? (
                  <ResponsiveButton
                    onClick={onSave}
                    aria-label={t("save")}
                    variant="outlined"
                    size="small"
                  >
                    <Save fontSize="small" />
                    <Box component="span" sx={{ fontSize: "0.75rem" }}>
                      {t("save")}
                    </Box>
                  </ResponsiveButton>
                ) : (
                  <IconButton onClick={onSave} aria-label={t("save")}>
                    <Save />
                  </IconButton>
                ))}
              {onReload &&
                (showLabels ? (
                  <ResponsiveButton
                    onClick={onReload}
                    aria-label={t("reload")}
                    variant="outlined"
                    size="small"
                  >
                    <Refresh fontSize="small" />
                    <Box component="span" sx={{ fontSize: "0.75rem" }}>
                      {t("reload")}
                    </Box>
                  </ResponsiveButton>
                ) : (
                  <IconButton onClick={onReload} aria-label={t("reload")}>
                    <Refresh />
                  </IconButton>
                ))}
            </>
          )}
        </ButtonGroup>

        <Box sx={{ flex: 1 }} />

        {/* Destructive actions (right side) */}
        {editMode && (
          <ButtonGroup variant={showLabels ? "outlined" : "text"} size="small">
            {onReset &&
              (showLabels ? (
                <ResponsiveButton
                  onClick={onReset}
                  aria-label={t("reset")}
                  variant="outlined"
                  size="small"
                >
                  <DangerousOutlined fontSize="small" />
                  <Box component="span" sx={{ fontSize: "0.75rem" }}>
                    {t("reset")}
                  </Box>
                </ResponsiveButton>
              ) : (
                <IconButton onClick={onReset} aria-label={t("reset")}>
                  <DangerousOutlined />
                </IconButton>
              ))}
            {onRemove &&
              (showLabels ? (
                <ResponsiveButton
                  onClick={onRemove}
                  aria-label={t("delete permanently")}
                  variant="outlined"
                  size="small"
                >
                  <Delete fontSize="small" />
                  <Box component="span" sx={{ fontSize: "0.75rem" }}>
                    {t("delete")}
                  </Box>
                </ResponsiveButton>
              ) : (
                <IconButton
                  onClick={onRemove}
                  aria-label={t("delete permanently")}
                >
                  <Delete />
                </IconButton>
              ))}
          </ButtonGroup>
        )}

        {children || null}
      </Box>
    </Toolbar>
  );
};
