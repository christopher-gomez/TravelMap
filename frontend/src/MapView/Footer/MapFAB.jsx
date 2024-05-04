import * as React from "react";
import ToolTipSpeedDial from "../../Util/SpeedDial";
import SatelliteAltIcon from "@mui/icons-material/SatelliteAlt";
import DirectionsTransitIcon from "@mui/icons-material/DirectionsTransit";
import MapIcon from "@mui/icons-material/Map";
import { Google, Lock, LockOpen, Logout } from "@mui/icons-material";

export default function MapFAB({
  currentRenderType,
  setCurrentRenderType,
  currentMapStyle,
  setCurrentMapStyle,
  drawerHeight,
  mapLocked,
  setMapLocked,
  signInToken,
  setSignInToken,
  googleAccount,
}) {
  const speedDialActions = [
    {
      icon: signInToken ? <Logout /> : <Google />,
      name: signInToken ? "Sign out" : "Sign in with Google",
      onClick: () => {
        if (window.google && !signInToken) {
          window.google.accounts.id.prompt((notification) => {
            if (
              notification.isNotDisplayed() ||
              notification.isSkippedMoment()
            ) {
              // Handle the failure to display or user skipping the sign-in prompt
              console.log("Sign-in prompt not displayed or was skipped.");
            }
          });
        } else if (window.google && googleAccount) {
          // window.google.accounts.id.disableAutoSelect();
          // window.google.accounts.id.disablePrompt();
          console.log("Revoking token");
          window.google.accounts.id.revoke(googleAccount.email, (done) => {
            console.log("consent revoked", done);
            window.location.reload();
          });
          setSignInToken(null);
          // localStorage.removeItem("googleSignInToken");
        } else {
          console.log("Google API not loaded");
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
