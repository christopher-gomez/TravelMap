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

const ITEM_HEIGHT = 36;
const ITEM_PADDING_TOP = 4;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
      backgroundColor: "white",
      fontFamily: "'Indie Flower', cursive",
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

  return (
    <div>
      <FormControl
        sx={{ m: 1, minWidth: 150, fontFamily: "'Indie Flower', cursive" }}
        size="small"
      >
        <InputLabel
          id="demo-multiple-chip-label"
          sx={{
            backgroundColor: disabled ? "transparent" : "rgba(255, 255, 255, 0.5) !important",
            color: disabled ? "rgba(0,0,0,.15)" : "black !important",
            padding: "2px",
            borderRadius: "4px",
            fontFamily: "'Indie Flower', cursive",
          }}
        >
          {label}
        </InputLabel>
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
    </div>
  );
}
