import * as React from "react";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import OutlinedInput from "@mui/material/OutlinedInput";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import Chip from "@mui/material/Chip";
import "./MultipleSelect.css";
import Checkbox from "@mui/material/Checkbox";
import ListItemText from "@mui/material/ListItemText";
import { ClickAwayListener, Paper, Popper } from "@mui/material";

const ITEM_HEIGHT = 36;
const ITEM_PADDING_TOP = 4;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      // width: 250,
      backgroundColor: "white",
      fontFamily: "'Indie Flower', cursive",
      padding: 0,
    },
  },
};

function getStyles(name, personName, theme) {
  return {
    fontFamily: "'Indie Flower', cursive",
    fontWeight: Array.isArray(personName)
      ? personName.indexOf(name) === -1
        ? theme.typography.fontWeightRegular
        : theme.typography.fontWeightMedium
      : personName === name
      ? theme.typography.fontWeightMedium
      : theme.typography.fontWeightRegular,
    minHeight: "36px",
    // padding: 0
  };
}

export default function MultipleSelectChip({
  options,
  labels,
  onChange,
  label,
  multiple,
  value,
  disabled,
  chipSx,
}) {
  const theme = useTheme();
  const [personName, setPersonName] = React.useState([]);

  const handleChange = (event) => {
    const {
      target: { value },
    } = event;

    // On autofill we get a stringified value.
    const val = multiple
      ? typeof value === "string"
        ? value.split(",")
        : value
      : value;

    setPersonName(val);

    if (onChange) {
      onChange(val);
    }
  };

  const [open, setOpen] = React.useState(false);

  if (!chipSx) {
    chipSx = {};
  }

  return (
    <Box sx={{ display: "flex", flexFlow: "column" }}>
      <Chip
        label={label}
        onClick={() => setOpen(!open)}
        variant="filled"
        sx={{ backgroundColor: "white" }}
      />
      {open && (
        <FormControl
          sx={{ m: 1, minWidth: 150, fontFamily: "'Indie Flower', cursive" }}
          size="small"
        >
          {/* <InputLabel
            id="demo-multiple-chip-label"
            sx={{
              backgroundColor: disabled
                ? "transparent"
                : "rgba(255, 255, 255, 0.5) !important",
              color: disabled ? "rgba(0,0,0,.15)" : "black !important",
              padding: "2px",
              borderRadius: "4px",
              fontFamily: "'Indie Flower', cursive",
            }}
          >
            {label}
          </InputLabel> */}
          <Select
            disabled={disabled ?? false}
            autoWidth
            labelId="demo-multiple-chip-label"
            id="demo-multiple-chip"
            multiple={multiple}
            value={value ?? personName}
            onChange={handleChange}
            sx={{
              backgroundColor: "white",
              color: "black",
              fontFamily: "'Indie Flower', cursive",
              "&.Mui-disabled": {
                backgroundColor: "rgba(0, 0, 0, 0)",
                borderColor: "rgba(0, 0, 0, .1) !important",
                outlineColor: "rgba(0, 0, 0, .1) !important",
              },
            }}
            input={
              <OutlinedInput
                id="select-multiple-chip"
                label={label}
                sx={{ fontFamily: "'Indie Flower', cursive" }}
              />
            }
            renderValue={(selected) => (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {Array.isArray(selected) ? (
                  selected.map((value) => (
                    <Chip
                      key={value}
                      label={value}
                      sx={{ fontFamily: "'Indie Flower', cursive" }}
                    />
                  ))
                ) : (
                  <Chip
                    key={selected}
                    label={selected}
                    sx={{ fontFamily: "'Indie Flower', cursive" }}
                  />
                )}
              </Box>
            )}
            MenuProps={MenuProps}
          >
            {options.map((name, i) => (
              <MenuItem
                key={name}
                value={name}
                style={getStyles(name, personName, theme)}
                sx={{ fontFamily: "'Indie Flower', cursive" }}
              >
                {multiple && (
                  <Checkbox
                    checked={
                      value
                        ? Array.isArray(value)
                          ? value.indexOf(name) > -1
                          : value === name
                        : personName.indexOf(name) > -1
                    }
                  />
                )}
                <ListItemText
                  primary={labels ? labels[i] : name}
                  sx={{ fontFamily: "'Indie Flower', cursive" }}
                />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </Box>
  );
}

export function ChipSelectMenu({
  options,
  labels,
  onChange,
  label,
  multiple,
  value,
  disabled,
  icon,
  startOpen = false,
  deleteIcon,
  onDelete,
  openOnDelete = false,
  elRef,
  chipSx,
}) {
  const theme = useTheme();
  const [personName, setPersonName] = React.useState([]);

  const chipRef = React.useRef(null);

  const handleChange = (event) => {
    const {
      target: { value },
    } = event;

    // On autofill we get a stringified value.
    const val = multiple
      ? typeof value === "string"
        ? value.split(",")
        : value
      : value;

    setPersonName(val);

    if (onChange) {
      onChange(val);
    }
  };

  const [open, setOpen] = React.useState(startOpen);
  React.useEffect(() => {
    setOpen(startOpen);
  }, [startOpen]);

  const [chipHeight, setChipHeight] = React.useState(0);
  const [chipLeft, setChipLeft] = React.useState(0);

  React.useEffect(() => {
    if (chipRef.current || elRef) {
      const el = elRef ?? chipRef.current;
      const rect = el.getBoundingClientRect();
      setChipHeight(rect.top + rect.height - 10);
      setChipLeft(rect.left - 50);
    }
  }, [chipRef.current, elRef, open]);

  if (!chipSx) {
    chipSx = {};
  }

  return (
    <Box sx={{ display: "flex", flexFlow: "column" }}>
      <Chip
        icon={icon}
        deleteIcon={deleteIcon}
        onDelete={
          onDelete ? onDelete : openOnDelete ? () => setOpen(true) : undefined
        }
        ref={chipRef}
        label={label}
        onClick={() => setOpen(!open)}
        variant="filled"
        sx={{
          backgroundColor: "white !important",
          overflow: "visible !important",
          ":hovered": { backgroundColor: "white !important" },
          ":focused": { backgroundColor: "white !important" },
          "> .MuiChip-deleteIcon": {
            color: "rgba(0,0,0,.54) !important",
          },
          boxShadow: "0px 1px 10px 0px rgba(0, 0, 0, 0.5)",
          ...chipSx,
        }}
      />
      <FormControl
        sx={{
          m: 1, // Remove all margins
          p: 1, // Remove all padding
          border: "none", // Ensure no borders are visible
          visibility: "hidden", // Only show when the select is open
          position: "absolute", // Use absolute to minimize impact on layout
          top: `${chipHeight}px`, // Position just below the chip
          left: `${chipLeft}px`, // Adjusted to the actual left position of the Chip
          minWidth: 150,
          fontFamily: "'Indie Flower', cursive",
          zIndex: 2, // Ensure it's above other content but below modals/etc.
        }}
        size="small"
      >
        {/* <InputLabel
            id="demo-multiple-chip-label"
            sx={{
              backgroundColor: disabled
                ? "transparent"
                : "rgba(255, 255, 255, 0.5) !important",
              color: disabled ? "rgba(0,0,0,.15)" : "black !important",
              padding: "2px",
              borderRadius: "4px",
              fontFamily: "'Indie Flower', cursive",
            }}
          >
            {label}
          </InputLabel> */}
        <Select
          disabled={disabled ?? false}
          autoWidth
          labelId="demo-multiple-chip-label"
          id="demo-multiple-chip"
          multiple={multiple}
          value={
            value ? (Array.isArray(value) && value.length > 0 ? value : "") : ""
          }
          onChange={handleChange}
          open={open}
          onClose={() => setOpen(false)}
          onOpen={() => setOpen(true)}
          sx={{
            backgroundColor: "white",
            color: "black",
            fontFamily: "'Indie Flower', cursive",
            "&.Mui-disabled": {
              backgroundColor: "rgba(0, 0, 0, 0)",
              borderColor: "rgba(0, 0, 0, .1) !important",
              outlineColor: "rgba(0, 0, 0, .1) !important",
            },
            "& .MuiSelect-select": {
              display: "none", // Hides the select input entirely
            },
          }}
          // input={
          //   <OutlinedInput
          //     id="select-multiple-chip"
          //     label={label}
          //     sx={{ fontFamily: "'Indie Flower', cursive" }}
          //   />
          // }
          // renderValue={(selected) => (
          //   <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
          //     {Array.isArray(selected) ? (
          //       selected.map((value) => (
          //         <Chip
          //           key={value}
          //           label={value}
          //           sx={{ fontFamily: "'Indie Flower', cursive" }}
          //         />
          //       ))
          //     ) : (
          //       <Chip
          //         key={selected}
          //         label={selected}
          //         sx={{ fontFamily: "'Indie Flower', cursive" }}
          //       />
          //     )}
          //   </Box>
          // )}
          MenuProps={MenuProps}
        >
          {options.map((name, i) => (
            <MenuItem
              key={name}
              value={name}
              style={getStyles(name, personName, theme)}
              sx={{ fontFamily: "'Indie Flower', cursive" }}
            >
              {multiple && (
                <Checkbox
                  checked={
                    value
                      ? Array.isArray(value)
                        ? value.indexOf(name) > -1
                        : value === name
                      : personName.indexOf(name) > -1
                  }
                />
              )}
              <ListItemText
                primary={labels ? labels[i] : name}
                sx={{ fontFamily: "'Indie Flower', cursive" }}
              />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}

export function ChipPopperMenu({
  icon,
  children,
  label,
  onDelete,
  deleteIcon,
  openOnDelete = false,
  onToggledOpen,
  onClick,
  chipSx,
  open,
}) {
  const theme = useTheme();
  const [_open, setOpen] = React.useState(open);
  const chipRef = React.useRef(null);

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event) => {
    if (chipRef.current && chipRef.current.contains(event.target)) {
      return;
    }
    setOpen(false);
  };

  React.useEffect(() => {
    if (onToggledOpen) {
      onToggledOpen(open);
    }
  }, [_open]);

  React.useEffect(() => {
    setOpen(open);
  }, [open]);

  if (!chipSx) {
    chipSx = {};
  }

  return (
    <ClickAwayListener onClickAway={handleClose}>
      <Box sx={{ display: "flex", flexFlow: "column", position: "relative" }}>
        <Chip
          icon={icon}
          deleteIcon={deleteIcon}
          onDelete={
            onDelete ? onDelete : openOnDelete ? handleToggle : undefined
          }
          ref={chipRef}
          label={label}
          onClick={onClick !== undefined ? onClick : handleToggle}
          variant="filled"
          sx={{
            backgroundColor: "white !important",
            overflow: "visible !important",
            ":hover": { backgroundColor: "white !important" },
            ":focus": { backgroundColor: "white !important" },
            boxShadow: "0px 1px 10px 0px rgba(0, 0, 0, 0.5)",
            ...chipSx,
          }}
        />
        <Popper
          open={_open}
          anchorEl={chipRef.current}
          placement="bottom"
          sx={{ zIndex: 10000000000 + 1 }}
        >
          <Paper
            sx={{
              p: 1,
              mt: 1,
              boxShadow: "0px 1px 10px 0px rgba(0, 0, 0, 0.5)",
            }}
          >
            {children}
          </Paper>
        </Popper>
      </Box>
    </ClickAwayListener>
  );
}
