import * as React from "react";
import { Global } from "@emotion/react";
import { Drawer, IconButton } from "@mui/material";
import ArrowBackIos from "@mui/icons-material/ArrowBackIos";

export default function StandardDrawer({
  open,
  onClose,
  DrawerContent,
  variant = "persistent",
  anchor = "left",
  sx = {},
  paperSx = {},
}) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const timeoutRef = React.useRef(null);
  React.useEffect(() => {
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(
      () => {
        setDrawerOpen(open);
      },
      open ? 0 : 0
    );

    return () => {
      window.clearTimeout(timeoutRef.current);
    };
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
      {open && (
        <Drawer
          sx={{
            pointerEvents: "none",
            "> .MuiPaper-root": {
              pointerEvents: "all",
              overflowY: "auto", // Set overflow to hidden to establish a block formatting context
              display: "flex", // Make this a flex container
              flexDirection: "column", // Stack children vertically
              // borderRadius: "0em 1em 0em 0em",
              padding: "0",
              minWidth: "420px",
              maxWidth: "420px",
              height: "100%", // Set the height to 100% of the viewport
              position: "relative",
              // scrollbarWidth: "thin",
              // scrollbarColor: "#c1c1c1 #f0f0f0",
              "&::-webkit-scrollbar": {
                width: "0.5em",
                height: "0.5em",
              },
              "&::-webkit-scrollbar-track": {
                background: "#f0f0f0 !important",
                borderRadius: "10px",
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "#c1c1c1 !important",
                borderRadius: "10px",
                backgroundClip: "content-box",
                border: "2px solid transparent",
              },
              ...paperSx
            },
            ...sx,
          }}
          variant={variant ? variant : "persistent"}
          anchor={anchor ? anchor : "left"}
          PaperProps={{ style: { zIndex: 9999 } }}
          open={drawerOpen}
          onClose={toggleDrawer(false)}
          onOpen={() => {
            toggleDrawer(true);
          }}
          hideBackdrop
        >
          {/* <div
          style={{
            position: "absolute",
            bottom: "0",
            right: open ? "-2.52em" : "0",
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
        </div> */}
          {DrawerContent}
        </Drawer>
      )}
    </React.Fragment>
  );
}
