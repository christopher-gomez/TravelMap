import * as React from "react";
import SpeedDial from "@mui/material/SpeedDial";
import SpeedDialIcon from "@mui/material/SpeedDialIcon";
import SpeedDialAction from "@mui/material/SpeedDialAction";
import { isTouchDevice } from "./Utils";

export default function ToolTipSpeedDial({
  actions,
  icon,
  position = { bottom: 16, left: 16 },
}) {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  if (!position) position = { bottom: 16, left: 16 };

  return (
    <SpeedDial
      ariaLabel="SpeedDial tooltip example"
      sx={{ position: "absolute", ...position, transition: "all 0.5s ease"}}
      icon={icon ?? <SpeedDialIcon />}
      onClose={handleClose}
      onOpen={handleOpen}
      open={open}
    >
      {actions.map((action) => (
        <SpeedDialAction
          key={action.name}
          icon={action.icon}
          tooltipTitle={action.name}
          tooltipOpen={isTouchDevice()}
          onClick={() => {
            if (action.onClick) action.onClick();
            handleClose();
          }}
        />
      ))}
    </SpeedDial>
  );
}
