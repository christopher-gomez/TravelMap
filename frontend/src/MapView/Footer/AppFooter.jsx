import * as React from "react";
import MapFAB from "./MapFAB";
import SwipeableEdgeDrawer from "../../Util/SwipeableEdgeDrawer";
import MapDrawer from "./MapDrawer";
import { isTouchDevice } from "../../Util/Utils";
import {
  CenterFocusStrong,
  CropFree,
  FlashlightOff,
  FlashlightOn,
  GpsFixed,
  Lock,
  LockOpen,
} from "@mui/icons-material";
import ToolTipSpeedDial from "../../Util/SpeedDial";

export default function AppFooter({
  currentRenderType,
  setCurrentRenderType,
  currentMapStyle,
  setCurrentMapStyle,
  focusedMarker,
  focusedCluster,
  timelineActivities,
  mapLocked,
  setMapLocked,
  googleAccount,
  setErrorPopupOpen,
  onRecenterMap,
  setShouldVignette,
  shouldVignette,
  shouldKeepFocusCentered,
  setShouldKeepFocusCentered,
}) {
  const [DRAWER_HEADER_HEIGHT, setDRAWER_HEADER_HEIGHT] = React.useState(0);
  const [drawerHeight, setDrawerHeight] = React.useState(0);

  React.useEffect(() => {
    if (!focusedMarker && !focusedCluster) setDrawerHeight(0);
    else setDrawerHeight(DRAWER_HEADER_HEIGHT);
  }, [focusedCluster, focusedMarker]);

  React.useEffect(() => {
    setDrawerHeight(DRAWER_HEADER_HEIGHT);
  }, [DRAWER_HEADER_HEIGHT]);

  return (
    <>
      <ToolTipSpeedDial
        icon={
          <GpsFixed
            onClick={() => {
              if (onRecenterMap) onRecenterMap();
            }}
          />
        }
        // position={{ bottom: 16 + drawerHeight, left: 16 }}
        // tooltip={ { title: "Recenter Map",  placement: 'right-end'}
        // }
        open={
          focusedMarker ||
          focusedCluster ||
          (timelineActivities && timelineActivities.length > 0)
            ? true
            : undefined
        }
        direction="up"
        actions={[
          {
            icon: mapLocked ? <LockOpen /> : <Lock />,
            name: mapLocked ? "Unlock Map Control" : "Lock Map Control",
            tooltipPlacement: "right",
            onClick: () => setMapLocked(!mapLocked),
          },
          {
            icon: shouldKeepFocusCentered ? (
              <CenterFocusStrong />
            ) : (
              <CropFree />
            ),
            tooltipPlacement: "right",
            name: shouldKeepFocusCentered
              ? "Disable Focus Center Lock"
              : "Enable Focus Center Lock",
            onClick: () => setShouldKeepFocusCentered(!shouldKeepFocusCentered),
          },
          {
            icon: shouldVignette ? <FlashlightOn /> : <FlashlightOff />,
            tooltipPlacement: "right",
            name: shouldVignette
              ? "Disable Focus Spotlight"
              : "Enable Focus Spotlight",
            onClick: () => setShouldVignette(!shouldVignette),
          },
        ]}
      />
      <MapFAB
        currentRenderType={currentRenderType}
        setCurrentRenderType={setCurrentRenderType}
        currentMapStyle={currentMapStyle}
        setCurrentMapStyle={setCurrentMapStyle}
        drawerHeight={drawerHeight}
        focusedMarker={focusedMarker}
        focusedCluster={focusedCluster}
        mapLocked={mapLocked}
        setMapLocked={setMapLocked}
        googleAccount={googleAccount}
        setErrorPopupOpen={setErrorPopupOpen}
      />
      {/* <MapDrawer
        onHeightChange={(height, open) => {
          setDrawerHeight(open ? height + 16 : height);
        }}
        focusedMarker={focusedMarker}
        focusedCluster={focusedCluster}
        onClose={onDrawerClose}
        onHeaderHeightChange={(height) => {
          setDRAWER_HEADER_HEIGHT(height);
        }}
        allMarkers={allMarkers}
        setFocusedMarker={setFocusedMarker}
        offsetCenter={offsetCenter}
        googleAccount={googleAccount}
        onUpdateDate={onUpdateDate}
        calculateDay={calculateDay}
        onUpdateTitle={onUpdateTitle}
        setLoginPopupOpen={setLoginPopupOpen}
        allTags={allTags}
        onTagsUpdated={onTagsUpdated}
        allTimes={allTimes}
        onTimeUpdated={onTimeUpdated}
        currentDayFilter={currentDayFilter}
      /> */}
    </>
  );
}
