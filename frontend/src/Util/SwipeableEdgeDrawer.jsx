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

  return (
    <>
      <Global
        styles={{
          ".MuiDrawer-root": { pointerEvents: "none" },
          ".MuiDrawer-root > .MuiPaper-root": {
            pointerEvents: "all",
            height: `calc(50% - ${drawerBleeding}px)`,
            overflow: "visible",
          },
          ".MuiDrawer-root > .PrivateSwipeArea-root": {
            height: headerHeight,
          },
        }}
      />
      <SwipeableDrawer
        anchor="bottom"
        open={open}
        onClose={toggleDrawer(false)}
        onOpen={toggleDrawer(true)}
        swipeAreaWidth={drawerBleeding}
        disableSwipeToOpen={false}
        hideBackdrop
        disableBackdropTransition
        disableDiscovery
        slotProps={{ backdrop: { invisible: true } }}
        ModalProps={{
          keepMounted: true,
        }}
      >
        <StyledBox
          sx={{
            position: "absolute",
            top: hidden ? "100%" : -drawerBleeding,
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
          }}
        >
          <Puller />
          {HeaderContent !== undefined && (
            <StyledBox sx={{ p: 2, pt: 0, backgroundColor: "transparent" }}>{HeaderContent}</StyledBox>
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
