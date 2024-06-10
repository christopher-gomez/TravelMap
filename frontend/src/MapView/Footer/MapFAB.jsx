import * as React from "react";
import ToolTipSpeedDial from "../../Util/SpeedDial";
import SatelliteAltIcon from "@mui/icons-material/SatelliteAlt";
import DirectionsTransitIcon from "@mui/icons-material/DirectionsTransit";
import MapIcon from "@mui/icons-material/Map";
import {
  CenterFocusStrong,
  CropFree,
  FlashlightOff,
  FlashlightOn,
  Google,
  Lock,
  LockOpen,
  Logout,
} from "@mui/icons-material";
import { PromptSignIn, SignOut } from "../../Util/GooglePrompt";

export default function MapFAB({
  currentRenderType,
  setCurrentRenderType,
  currentMapStyle,
  setCurrentMapStyle,
  drawerHeight,
  mapLocked,
  setMapLocked,
  // signInToken,
  // setSignInToken,
  googleAccount,
  setErrorPopupOpen,
  setShouldVignette,
  shouldVignette,
  shouldKeepFocusCentered,
  setShouldKeepFocusCentered,
}) {
  const speedDialActions = [
    {
      icon: googleAccount ? <Logout /> : <Google />,
      name: googleAccount ? "Sign out" : "Sign in with Google",
      onClick: () => {
        if (!googleAccount) {
          PromptSignIn(() => {
            setErrorPopupOpen(true);
          });
        } else if (googleAccount) {
          SignOut(googleAccount);
          // setSignInToken(null);
        }
      },
    },
    {
      icon: mapLocked ? <LockOpen /> : <Lock />,
      name: mapLocked ? "Unlock Map Control" : "Lock Map Control",
      onClick: () => setMapLocked(!mapLocked),
    },
    {
      icon: <SatelliteAltIcon />,
      name: "Toggle Satellite",
      onClick: () => {
        if (currentRenderType === "roadmap") setCurrentRenderType("satellite");
        else setCurrentRenderType("roadmap");
      },
    },
    {
      icon: shouldVignette ? <FlashlightOn /> : <FlashlightOff />,
      name: shouldVignette
        ? "Disable Focus Spotlight"
        : "Enable Focus Spotlight",
      onClick: () => setShouldVignette(!shouldVignette),
    },
    {
      icon: shouldKeepFocusCentered ? <CenterFocusStrong /> : <CropFree />,
      name: shouldKeepFocusCentered
        ? "Disable Focus Center Lock"
        : "Enable Focus Center Lock",
      onClick: () => setShouldKeepFocusCentered(!shouldKeepFocusCentered),
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
      direction="left"
      actions={speedDialActions}
      icon={<MapIcon />}
      position={{ bottom: 16 + drawerHeight, right: 16 }}
    />
  );
}
