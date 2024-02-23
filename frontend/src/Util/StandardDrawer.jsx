import * as React from "react";
import { Global } from "@emotion/react";
import { Drawer, IconButton } from "@mui/material";
import ArrowBackIos from "@mui/icons-material/ArrowBackIos";

export default function StandardDrawer({ open, onClose, DrawerContent }) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  React.useEffect(() => {
    setDrawerOpen(open);
  }, [open]);

  const toggleDrawer = (open) => (event) => {
    if (
      event &&
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }

    setDrawerOpen(open);

    if (!open) {
      if (onClose) onClose();
    }
  };

  return (
    <React.Fragment>
      <Global
        styles={{
          ".MuiDrawer-root": {
            pointerEvents: "none",
          },
          ".MuiDrawer-root > .MuiPaper-root": {
            pointerEvents: "all",
            overflow: "visible", // Set overflow to hidden to establish a block formatting context
            display: "flex", // Make this a flex container
            flexDirection: "column", // Stack children vertically
            borderRadius: "0em 1em 0em 0em",
            padding: "1em",
            paddingBottom: "0",
            paddingTop: "64px",
            minWidth: "17em",
            maxWidth: "17em",
            height: "100%", // Set the height to 100% of the viewport
          },
        }}
      />
      <Drawer
        disablePortal
        anchor={"left"}
        PaperProps={{ style: { zIndex: 1 } }}
        open={drawerOpen}
        onClose={toggleDrawer(false)}
        onOpen={toggleDrawer(true)}
        hideBackdrop
      >
        <div
          style={{
            position: "absolute",
            bottom: "0",
            right: open ? "-2.25em" : "0",
            backgroundColor: "white",
            borderRadius: "0em 1em 1em 0em",
            cursor: "pointer",
            zIndex: 99999 + 1,
            pointerEvents: "all",
            transition: "all 0.5s ease",
          }}
        >
          <IconButton onClick={toggleDrawer(false)}>
            <ArrowBackIos />
          </IconButton>
        </div>
        {DrawerContent}
      </Drawer>
    </React.Fragment>
  );
}
