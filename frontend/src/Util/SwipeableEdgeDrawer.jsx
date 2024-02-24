import * as React from "react";
import { Global } from "@emotion/react";
import { styled } from "@mui/material/styles";
import { grey } from "@mui/material/colors";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import { Box, IconButton } from "@mui/material";
import { Close, KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
const Root = styled("div")(({ theme }) => ({
  height: "100%",
  backgroundColor:
    theme.palette.mode === "light"
      ? grey[100]
      : theme.palette.background.default,
}));

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
  HeaderContent,
  DrawerContent,
  onClose,
}) {
  const [drawerBleeding, setDrawerBleeding] = React.useState(null);

  // React.useEffect(() => {
  //   if (
  //     headerHeight === undefined ||
  //     headerHeight === null ||
  //     headerHeight <= 0
  //   )
  //     headerHeight = 56;

  //   setDrawerBleeding(headerHeight);
  // }, [headerHeight]);

  const [open, setOpen] = React.useState(false);
  const [headerHidden, setHeaderHidden] = React.useState(hidden);

  const drawerHeaderRef = React.useRef();

  React.useEffect(() => {
    if (hidden) {
      setDrawerBleeding(null);
      return;
    }

    if (drawerHeaderRef.current) {
      const drawerHeaderHeight = drawerHeaderRef.current.clientHeight;
      setDrawerBleeding(drawerHeaderHeight);
    }
  }, [drawerHeaderRef, hidden, HeaderContent]);

  React.useEffect(() => {
    if (drawerBleeding !== null) {
      setHeaderHidden(false);
    } else {
      setHeaderHidden(false);
    }
  }, [drawerBleeding]);

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

  const [atBottom, setAtBottom] = React.useState(false);
  const [atTop, setAtTop] = React.useState(true);

  React.useEffect(() => {
    if (!drawerRef.current) return;

    else console.log("set drawer ref")

    const scrollable = drawerRef.current;
    // Attach the scroll event listener
    scrollable.addEventListener("scroll", checkScroll);

    // Remove the event listener on cleanup
    return () => {
      console.log('removing`')
      scrollable.removeEventListener("scroll", checkScroll);
    };
  }, [drawerRef, headerHidden, open]);

  const checkScroll = () => {
    if (drawerRef.current) {
      console.log("check scroll")
      const { scrollTop, scrollHeight, clientHeight } = drawerRef.current;
      // Set state based on scroll position
      setAtBottom(scrollTop + clientHeight >= scrollHeight);
      setAtTop(scrollTop === 0);
    }
  };

  return (
    <Root>
      <Global
        styles={{
          ".MuiDrawer-root": { pointerEvents: "none", overflow: "hidden" },
          ".MuiDrawer-root > .MuiPaper-root": {
            pointerEvents: "all",
            height: `calc(60% - ${drawerBleeding}px)`,
            minHeight: "30%",
            maxHeight: "45%",
            overflow: "visible",
          },
          ".PrivateSwipeArea-root": {
            height: drawerBleeding,
            pointerEvents: headerHidden ? "none" : "all",
          },
        }}
      />
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
          height: "auto",
          display: "flex",
          flexDirection: "column",
          alignContent: "center",
          justifyContent: "start",
          justifyItems: "center",
          alignItems: "center",
          boxShadow: "0px -10px 10px 0px rgba(0,0,0,0.15)",
          pointerEvents: "none",
          visibility: "hidden",
          opacity: 0,
          overflow: "hidden",
          pt: 2,
          pb: 2,
        }}
        ref={drawerHeaderRef}
      >
        <Puller />
        <StyledBox
          sx={{
            display: "flex",
            justifyContent: "space-between",
            flexFlow: "row",
            justifyItems: "center",
            width: "100%",
            p: 2,
            pt: 0,
            pb: 0,
            mb: 1,
          }}
        >
          <IconButton
            onClick={() => {
              setHeaderHidden(true);
            }}
            sx={{
              color: grey[500],
              border: `1px solid ${grey[500]}`,
              padding: 0,
            }}
          >
            <Close />
          </IconButton>
          <IconButton
            sx={{
              color: grey[500],
              border: `1px solid ${grey[500]}`,
              padding: 0,
            }}
            onClick={() => {
              setOpen(!open);
            }}
          >
            {!open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </StyledBox>

        {HeaderContent !== undefined && (
          <StyledBox
            sx={{
              p: 2,
              pt: 0,
              pb: 0,
              backgroundColor: "transparent",
              userSelect: "none",
            }}
          >
            {HeaderContent}
          </StyledBox>
        )}
      </StyledBox>
      {drawerBleeding !== null && (
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
              height: "auto",
              display: "flex",
              flexDirection: "column",
              alignContent: "center",
              justifyContent: "start",
              justifyItems: "center",
              alignItems: "center",
              boxShadow: "0px -10px 10px 0px rgba(0,0,0,0.15)",
              pointerEvents: "all",
              overflow: "hidden",
              pt: 2,
              pb: 2,
            }}
          >
            <Puller />
            <StyledBox
              sx={{
                display: "flex",
                justifyContent: "space-between",
                flexFlow: "row",
                justifyItems: "center",
                width: "100%",
                p: 2,
                pt: 0,
                pb: 0,
                mb: 1,
              }}
            >
              <IconButton
                onClick={() => {
                  setHeaderHidden(true);
                }}
                sx={{
                  color: grey[500],
                  border: `1px solid ${grey[500]}`,
                  padding: 0,
                }}
              >
                <Close />
              </IconButton>
              <IconButton
                sx={{
                  color: grey[500],
                  border: `1px solid ${grey[500]}`,
                  padding: 0,
                }}
                onClick={() => {
                  setOpen(!open);
                }}
              >
                {!open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
              </IconButton>
            </StyledBox>

            {HeaderContent !== undefined && (
              <StyledBox
                sx={{
                  p: 2,
                  pt: 0,
                  pb: 0,
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
              pb: 2,
              mb: 2,
              height: "100%",
              overflow: "auto",
            }}
            ref={drawerRef}
          >
            <div className={`scroll-fade-top ${atTop ? "hidden" : ""}`}></div>
            {!DrawerContent && <Skeleton variant="rectangular" height="100%" />}
            {DrawerContent}
            <div
              className={`scroll-fade-bottom ${atBottom ? "hidden" : ""}`}
            ></div>
          </StyledBox>
        </SwipeableDrawer>
      )}
    </Root>
  );
}

export default SwipeableEdgeDrawer;
