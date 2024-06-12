import * as React from "react";
import { Drawer } from "@mui/material";
import { isElementOverflowing } from "./Utils";

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

  const paperRef = React.useRef(null);

  const [contentHovered, setContentHovered] = React.useState(false);

  return (
    <React.Fragment>
      {open && (
        <Drawer
          onPointerOver={(e) => {
            if (!e.target) return;

            // this needs to be a ref to the child Paper element
            if (paperRef.current && isElementOverflowing(paperRef.current))
              setContentHovered(true);
          }}
          onPointerOut={() => setContentHovered(false)}
          sx={{
            pointerEvents: "none",
            "> .MuiPaper-root": {
              pointerEvents: "all",
              overflowY: contentHovered ? "auto" : "hidden",
              overflowX: "hidden",
              display: "flex", // Make this a flex container
              flexDirection: "column", // Stack children vertically
              // borderRadius: "0em 1em 0em 0em",
              padding: "0",
              // pr: contentHovered ? "-5em" : 0, // Reserve space for scrollbar
              minWidth: "420px",
              maxWidth: "420px",
              height: "100%", // Set the height to 100% of the viewport
              position: "relative",
              boxShadow: '-2px 10px 20px rgba(0, 0, 0, 0.9)',
              pr: contentHovered ? "-.5em" : ".5em", // Reserve space for scrollbar
              flex: "1 1 auto",
              boxSizing: "border-box",
              overflowY: contentHovered ? "auto" : "hidden",
              "&::-webkit-scrollbar": {
                width: "0.5em",
                height: "0.5em",
                position: "absolute",
              },
              "&::-webkit-scrollbar-track": {
                background: "transparent !important",
                borderRadius: "20px",
                position: "absolute",
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "#708090 !important",
                borderRadius: "20px",
                backgroundClip: "content-box",
                border: "2px solid transparent",
                position: "absolute",
              },
              ...paperSx,
            },
            ...sx,
          }}
          variant={variant ? variant : "persistent"}
          anchor={anchor ? anchor : "left"}
          PaperProps={{ style: { zIndex: 9999 }, ref: paperRef, id: anchor + "-drawer"}}
          open={drawerOpen}
          onClose={toggleDrawer(false)}
          // onOpen={() => {
          //   toggleDrawer(true);
          // }}
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
