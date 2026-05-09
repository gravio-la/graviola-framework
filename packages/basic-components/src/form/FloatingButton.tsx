import { Button } from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";
import { Close as CloseSearchIcon } from "@mui/icons-material";

type FloatingButtonProps = {
  drawerOpen: boolean;
  drawerWidth: number;
  toggleDrawer: () => void;
};

export const FloatingButton = ({
  drawerOpen,
  drawerWidth,
  toggleDrawer,
}: FloatingButtonProps) => {
  return (
    <Button
      variant="contained"
      color="primary"
      sx={{
        // visibility: drawerOpen ? 'hidden' :  'visible',
        [":focus"]: {
          outline: "none",
        },
        position: "fixed",
        display: "inline-flex",
        justifyContent: "center",
        alignItems: "center",
        bottom: 10,
        minHeight: "36px",
        width: "72px",
        height: "48px",
        top: "10%",
        right: drawerOpen ? drawerWidth : 0,
        borderRadius: "24px 0 0 24px",
        zIndex: (theme) => theme.zIndex.drawer + 1,
        transition: (theme) =>
          theme.transitions.create("right", {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.leavingScreen,
          }),
      }}
      onClick={toggleDrawer}
    >
      {drawerOpen ? <CloseSearchIcon /> : <SearchIcon />}
    </Button>
  );
};
