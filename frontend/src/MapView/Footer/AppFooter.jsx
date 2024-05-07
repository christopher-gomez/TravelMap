import * as React from "react";
import MapFAB from "./MapFAB";
import SwipeableEdgeDrawer from "../../Util/SwipeableEdgeDrawer";
import MapDrawer from "./MapDrawer";
import { isTouchDevice } from "../../Util/Utils";

export default function AppFooter({
  currentRenderType,
  setCurrentRenderType,
  currentMapStyle,
  setCurrentMapStyle,
  focusedMarker,
  focusedCluster,
  onDrawerClose,
  setFocusedMarker,
  mapLocked,
  setMapLocked,
  googleAccount,
  setLoginPopupOpen,
  setErrorPopupOpen,
  allMarkers,
  offsetCenter,
  onUpdateDate,
  calculateDay,
  onUpdateTitle,
  allTags,
  onTagsUpdated,
  allTimes,
  onTimeUpdated,
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
      <MapDrawer
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
      />
    </>
  );
}
