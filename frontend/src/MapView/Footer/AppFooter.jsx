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
}) {

  const DRAWER_HEADER_HEIGHT = isTouchDevice() ? 200 : 0;
  const [drawerHeight, setDrawerHeight] = React.useState(0);

  React.useEffect(() => {
    if (!focusedMarker && !focusedCluster) setDrawerHeight(0);
    else setDrawerHeight(DRAWER_HEADER_HEIGHT);
  }, [focusedCluster, focusedMarker]);

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
      />
      <MapDrawer
        onHeightChange={setDrawerHeight}
        focusedMarker={focusedMarker}
        focusedCluster={focusedCluster}
        drawerHeaderHeight={DRAWER_HEADER_HEIGHT}
        onClose={onDrawerClose}
      />
    </>
  );
}
