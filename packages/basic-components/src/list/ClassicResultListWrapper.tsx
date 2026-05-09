import {
  Divider,
  ListItemButton,
  ListItemText,
  Grid,
  Box,
} from "@mui/material";
import { FunctionComponent } from "react";
import { useTranslation } from "next-i18next";

export type ClassicResultListWrapperProps = {
  key?: React.Key | null;
  label?: string;
  children?: React.ReactNode;
  handleClick?: (id: undefined) => void;
  hitCount?: number;
};

export const ClassicResultListWrapper: FunctionComponent<
  ClassicResultListWrapperProps
> = ({ label, children, handleClick, hitCount }) => {
  const { t } = useTranslation();
  return (
    <Grid container sx={{ width: "100%", display: "block" }}>
      <Grid sx={{ width: "100%" }}>
        <ListItemButton
          sx={{ width: "100%", flexGrow: 0 }}
          alignItems="flex-start"
          onClick={handleClick}
        >
          <ListItemText
            primary={label}
            primaryTypographyProps={{
              fontSize: 15,
              fontWeight: "medium",
              lineHeight: "20px",
              mb: "2px",
            }}
            secondary={
              hitCount > 0 ? t("found hits", { count: hitCount }) : t("no hits")
            }
            secondaryTypographyProps={{
              noWrap: true,
              fontSize: 12,
              lineHeight: "16px",
            }}
            sx={{ my: 0 }}
          />
        </ListItemButton>
      </Grid>
      <Divider />
      <Grid>
        <>
          <Box
            sx={{
              maxHeight: "100%",
              display: "block",
              flexGrow: 1,
              overflow: "auto",
            }}
          >
            {children}
          </Box>
          <Divider />
        </>
      </Grid>
    </Grid>
  );
};
