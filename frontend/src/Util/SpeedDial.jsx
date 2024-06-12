import * as React from "react";
import SpeedDial from "@mui/material/SpeedDial";
import SpeedDialIcon from "@mui/material/SpeedDialIcon";
import SpeedDialAction from "@mui/material/SpeedDialAction";
import { isTouchDevice } from "./Utils";
import { Tooltip } from "@mui/material";
import { isMobile } from "mobile-device-detect";

export default function ToolTipSpeedDial({
  actions,
  icon,
  position = { bottom: 16, left: 16 },
  tooltip,
  direction = "up",
  open,
  onSetOpen,
  ...others
}) {
  const [_open, setOpen] = React.useState(false);

  const [hadOpenProp, setHadOpenProp] = React.useState(false);

  React.useEffect(() => {
    if (open !== undefined) setOpen(open);
    if (open !== undefined) setHadOpenProp(true);

    if (open === undefined && hadOpenProp) setOpen(false);
    if (open === undefined) setHadOpenProp(false);
  }, [open]);

  React.useEffect(() => {
    if (onSetOpen) onSetOpen(_open);
  }, [_open]);

  const handleOpen = () => {
    if (open === undefined) setOpen(true);
  };
  const handleClose = () => {
    if (open === undefined) setOpen(false);
  };

  if (!position) position = { bottom: 16, left: 16 };

  const fab = (
    <SpeedDial
      ariaLabel="SpeedDial tooltip"
      sx={{ position: "absolute", ...position, transition: "all 0.5s ease" }}
      icon={icon ?? <SpeedDialIcon />}
      onClose={handleClose}
      onOpen={handleOpen}
      open={_open}
      direction={direction}
      {...others}
    >
      {actions !== undefined &&
        actions !== null &&
        actions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            tooltipPlacement={
              action.tooltipPlacement ? action.tooltipPlacement : undefined
            }
            tooltipOpen={isMobile ? false : undefined}
            onClick={() => {
              if (action.onClick) action.onClick();
              handleClose();
            }}
          />
        ))}
    </SpeedDial>
  );

  const component = tooltip ? <Tooltip {...tooltip}>{fab}</Tooltip> : fab;

  return component;
}
