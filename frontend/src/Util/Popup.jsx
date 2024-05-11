import * as React from "react";
import { styled } from "@mui/material/styles";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": {
    padding: theme.spacing(2),
    minWidth: "300px",
  },
  "& .MuiDialogActions-root": {
    padding: theme.spacing(1),
  },
}));

export default function Popup({
  open,
  setOpen,
  title,
  children,
  actions,
  dividers,
}) {
  const handleClose = () => {
    if (setOpen) setOpen(false);
  };

  return (
    <BootstrapDialog
      onClose={setOpen ? undefined : handleClose}
      aria-labelledby="customized-dialog-title"
      open={open}
      componentsProps={{
        backdrop: { style: { backdropFilter: "blur(3px)" } },
        root: { style: { zIndex: 999999 } },
      }}
    >
      {title && (
        <DialogTitle
          sx={{
            m: 0,
            p: 2,
            placeContent: "space-between",
            placeItems: "center",
            display: "flex",
          }}
          id="customized-dialog-title"
        >
          {title}
          {setOpen !== undefined && (
            <IconButton
              aria-label="close"
              onClick={handleClose}
              sx={{
                color: (theme) => theme.palette.grey[500],
              }}
            >
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>
      )}
      <DialogContent dividers={dividers}>{children}</DialogContent>
      {actions && (
        <DialogActions>
          {Array.isArray(actions)
            ? actions.map((action, i) => action)
            : actions}
        </DialogActions>
      )}
    </BootstrapDialog>
  );
}
