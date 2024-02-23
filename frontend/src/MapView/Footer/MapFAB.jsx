import * as React from "react";
import ToolTipSpeedDial from "../../Util/SpeedDial";
import SatelliteAltIcon from "@mui/icons-material/SatelliteAlt";
import DirectionsTransitIcon from "@mui/icons-material/DirectionsTransit";
import MapIcon from "@mui/icons-material/Map";

export default function MapFAB({
  currentRenderType,
  setCurrentRenderType,
  currentMapStyle,
  setCurrentMapStyle,
  drawerHeight,
}) {
  const speedDialActions = [
    {
      icon: <SatelliteAltIcon />,
      name: "Toggle Satellite",
      onClick: () => {
        if (currentRenderType === "roadmap") setCurrentRenderType("satellite");
        else setCurrentRenderType("roadmap");
      },
    },
  ];

  if (currentRenderType === "roadmap") {
    speedDialActions.push({
      icon: <DirectionsTransitIcon />,
      name: "Toggle Transit",
      onClick: () => {
        if (currentMapStyle === "default") setCurrentMapStyle("transit");
        else setCurrentMapStyle("default");
      },
    });
  }
  return (
    <ToolTipSpeedDial
      actions={speedDialActions}
      icon={<MapIcon />}
      position={{ bottom: 16 + drawerHeight, right: 16 }}
    />
  );
}
