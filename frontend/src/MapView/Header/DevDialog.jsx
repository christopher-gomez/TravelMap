import * as React from "react";
import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import Typography from "@mui/material/Typography";
import MultipleSelectChip from "../../Util/MultipleSelect";
import { Box, Chip, TextField } from "@mui/material";
import { updateLocationProperties } from "../UpdateLocationProperties";

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": {
    padding: theme.spacing(2),
    minWidth: "300px",
  },
  "& .MuiDialogActions-root": {
    padding: theme.spacing(1),
  },
}));

export default function DevDialog({ open, setOpen, items }) {
  const [locationState, setLocationState] = React.useState({});

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <BootstrapDialog
      onClose={handleClose}
      aria-labelledby="customized-dialog-title"
      open={open}
      disablePortal
      componentsProps={{
        backdrop: { style: { backdropFilter: "blur(3px)" } },
        root: { style: { zIndex: 999999 } },
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
        Locations
      </DialogTitle>
      <IconButton
        aria-label="close"
        onClick={handleClose}
        sx={{
          position: "absolute",
          right: 8,
          top: 8,
          color: (theme) => theme.palette.grey[500],
        }}
      >
        <CloseIcon />
      </IconButton>
      <DialogContent dividers>
        {items.map((item, i) => (
          <Box
            key={item.properties.Activity.title[0].plain_text + "-dev-box"}
            sx={{
              display: "flex",
              flexFlow: "column",
              gap: 1,
            }}
          >
            <Box
              key={item.properties.Activity.title[0].plain_text}
              sx={{
                display: "inline-flex",
                alignContent: "center",
                gap: 1,
                alignItems: "center",
              }}
            >
              <Chip
                key={item.properties.Activity.title[0].plain_text + "-chip"}
                label={item.properties.City.multi_select[0].name}
              />
              <Typography key={item.properties.Activity.title[0].plain_text}>
                {item.properties.Activity.title[0].plain_text}
              </Typography>
            </Box>
            <TextField
              variant="standard"
              label="Coordinates"
              onChange={(e) => {
                if (e.target.value.trim() === "" && item.id in locationState) {
                  setLocationState((prev) => {
                    delete prev[item.id];
                    return prev;
                  });
                  return;
                }

                setLocationState((prev) => ({
                  ...prev,
                  [item.id]: e.target.value,
                }));
              }}
            />
            {item.id in locationState && locationState[item.id] !== "" && (
              <Button
                onClick={async () => {
                  await updateLocationProperties({
                    id: item.id,
                    location: locationState[item.id],
                  });
                }}
              >
                Save
              </Button>
            )}
          </Box>
        ))}
      </DialogContent>
      <DialogActions></DialogActions>
    </BootstrapDialog>
  );
}
