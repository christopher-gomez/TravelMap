import * as React from "react";
import { Global } from "@emotion/react";
import { styled } from "@mui/material/styles";
import { grey } from "@mui/material/colors";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import { Box } from "@mui/material";

const StyledBox = styled("div")(({ theme }) => ({
  backgroundColor: theme.palette.mode === "light" ? "#fff" : grey[800],
}));

const Puller = styled("div")(({ theme }) => ({
  width: 100,
  height: 6,
  backgroundColor: theme.palette.mode === "light" ? grey[300] : grey[900],
  borderRadius: 3,
  position: "absolute",
  top: 8,
  left: "calc(50% - 50px)",
}));

function SwipeableEdgeDrawer({
  onHeightChange,
  hidden,
  headerHeight = 56,
  HeaderContent,
  DrawerContent,
  onClose,
}) {
  const [drawerBleeding, setDrawerBleeding] = React.useState(headerHeight);

  React.useEffect(() => {
    if (
      headerHeight === undefined ||
      headerHeight === null ||
      headerHeight <= 0
    )
      headerHeight = 56;

    setDrawerBleeding(headerHeight);
  }, [headerHeight]);

  const [open, setOpen] = React.useState(false);
  const [headerHidden, setHeaderHidden] = React.useState(hidden);

  React.useEffect(() => {
    setHeaderHidden(hidden);
  }, [hidden]);

  React.useEffect(() => {
    if (headerHidden) {
      setOpen(false);
      if (onClose) onClose();
    }
  }, [headerHidden]);

  const drawerRef = React.useRef();

  const toggleDrawer = (newOpen) => () => {
    setOpen(newOpen);
  };

  React.useEffect(() => {
    if (drawerRef.current) {
      const drawerHeight = drawerRef.current.clientHeight;
      onHeightChange(open ? drawerBleeding + drawerHeight : drawerBleeding);
    }
  }, [open, onHeightChange]);

  const [swipeStartY, setSwipeStartY] = React.useState(null);
  const [swipeEndY, setSwipeEndY] = React.useState(null);

  const handleTouchStart = (event) => {
    if (open) return;
    setSwipeStartY(event.touches[0].clientY);
  };

  const [drawerYPosition, setDrawerYPosition] = React.useState(0); // New state for drawer Y position

  const handleTouchMove = (event) => {
    if (!swipeStartY || open) return;
    const touchY = event.touches[0].clientY;
    const swipeDistance = touchY - swipeStartY;

    console.log("swipeDistance", swipeDistance);

    if (swipeDistance < 0) {
      setDrawerYPosition(0); // Prevent drawer from moving up
      return;
    } else {
      event.preventDefault(); // Prevent the window from scrolling
      event.stopPropagation();
    }

    setDrawerYPosition(swipeDistance); // Set the new drawer Y position
    setSwipeEndY(event.touches[0].clientY);
  };

  const handleTouchEnd = (event) => {
    if (open) return;
    if (swipeStartY && swipeEndY) {
      const swipeDistance = swipeEndY - swipeStartY;
      if (swipeDistance > 100) {
        // Adjust the threshold as needed
        setHeaderHidden(true);
      }
    }
    setSwipeStartY(null);
    setSwipeEndY(null);
    setDrawerYPosition(0);
  };

  return (
    <>
      <Global
        styles={{
          ".MuiDrawer-root": { pointerEvents: "none", overflow: "hidden" },
          ".MuiDrawer-root > .MuiPaper-root": {
            pointerEvents: "all",
            height: `calc(60% - ${drawerBleeding}px)`,
            overflow: "visible",
          },
          ".PrivateSwipeArea-root": {
            height: headerHeight,
            pointerEvents: headerHidden ? "none" : "all",
          },
        }}
      />
      <SwipeableDrawer
        allowSwipeInChildren
        anchor="bottom"
        open={open}
        onClose={toggleDrawer(false)}
        onOpen={toggleDrawer(true)}
        swipeAreaWidth={drawerBleeding}
        disableSwipeToOpen={false}
        hideBackdrop
        disableBackdropTransition
        disableDiscovery
        disablePortal
        slotProps={{ backdrop: { invisible: true } }}
      >
        <StyledBox
          sx={{
            position: "absolute",
            top: headerHidden ? "100%" : -drawerBleeding,
            borderTopLeftRadius: "1.5em",
            borderTopRightRadius: "1.5em",
            visibility: "visible",
            right: 0,
            left: 0,
            transition: "all 0.5s ease",
            height: headerHeight,
            display: "flex",
            alignContent: "center",
            justifyContent: "center",
            justifyItems: "center",
            alignItems: "center",
            boxShadow: "0px -10px 10px 0px rgba(0,0,0,0.15)",
            pointerEvents: "all",
            // transform: headerHidden || open ? "unset" : `translateY(${drawerYPosition}px)`,
          }}
          // onTouchStart={handleTouchStart}
          // onTouchEnd={handleTouchEnd}
          // onTouchMove={handleTouchMove}
        >
          <Puller />
          {HeaderContent !== undefined && (
            <StyledBox
              sx={{
                p: 2,
                pt: 0,
                backgroundColor: "transparent",
                userSelect: "none",
              }}
            >
              {HeaderContent}
            </StyledBox>
          )}
        </StyledBox>
        <StyledBox
          sx={{
            px: 2,
            pb: 0,
            height: "100%",
            overflow: "auto",
          }}
          ref={drawerRef}
        >
          {!DrawerContent && <Skeleton variant="rectangular" height="100%" />}
          {DrawerContent}
        </StyledBox>
      </SwipeableDrawer>
    </>
  );
}

export default SwipeableEdgeDrawer;
