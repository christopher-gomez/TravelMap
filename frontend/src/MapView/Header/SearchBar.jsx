import * as React from "react";
import { styled, alpha } from "@mui/material/styles";
import InputBase from "@mui/material/InputBase";
import FilterAlt from "@mui/icons-material/FilterAlt";
import { IconButton, TextField, Typography } from "@mui/material";
import "./SearchBar.css";
import Autocomplete from "@mui/material/Autocomplete";
import parse from "autosuggest-highlight/parse";
import match from "autosuggest-highlight/match";
import ClearIcon from "@mui/icons-material/Clear";

const Search = styled("div")(({ theme }) => ({
  position: "relative",
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 1),
  "&:hover": {
    backgroundColor: alpha(theme.palette.common.white, 1),
  },
  marginLeft: 0,
  width: "100%",
  borderRadius: "5em",
  transition: theme.transitions.create("width"),
  [theme.breakpoints.up("sm")]: {
    marginLeft: theme.spacing(1),
    width: "auto",
    minWidth: "200px",
    transition: theme.transitions.create("width"),
  },
  "& .MuiAutocomplete-root": {
    transition: theme.transitions.create("width"),
  },
  boxShadow: "0px 0px 15px 0px rgba(0, 0, 0, 0.3)",
  marginTop: "10px",
  zIndex: 10000000000
}));

const SearchIconWrapper = styled("div")(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: "100%",
  position: "absolute",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "black",
  cursor: "pointer",
  zIndex: 2,
}));

const StyledInputBase = styled(TextField)(({ theme }) => ({
  color: "black",
  "& .MuiInputBase-root": {
    width: "100% !important",
    padding: "2px 0px !important",
    borderRadius: "5em",
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)}) !important`,
    transition: theme.transitions.create("width"),
    [theme.breakpoints.up("sm")]: {
      width: "12ch",
      "&:focus": {
        width: "20ch",
      },
    },
  },
}));

export default function SearchBar({ markers, onSearch, onFilterClick }) {
  const hint = React.useRef("");
  const [inputValue, setInputValue] = React.useState("");

  // Create a Set to store unique info values
  const uniqueInfoSet = new Set();

  // Filter out duplicate markers based on the "info" property
  const uniqueMarkers = markers.filter((marker) => {
    if (uniqueInfoSet.has(marker.info)) {
      return false; // Skip this marker if its info value is already in the set
    } else {
      uniqueInfoSet.add(marker.info); // Add the info value to the set
      return true; // Include this marker in the uniqueMarkers array
    }
  });

  // Map the unique markers to the options array
  const options = uniqueMarkers.map((option, i) => ({
    label: option.info,
    id: i,
  }));

  return (
    <Search>
      <Autocomplete
        id="free-solo-demo"
        onKeyDown={(event) => {
          if (event.key === "Tab" || event.key === "Enter") {
            if (hint.current) {
              setInputValue(hint.current);
              onSearch(hint.current);
              event.preventDefault();
              return;
            } else if (inputValue) {
              const displayOptions = options.filter((option) =>
                option.label
                  .toLowerCase()
                  .trim()
                  .includes(inputValue.toLowerCase().trim())
              );

              if (displayOptions.length > 0) {
                setInputValue(displayOptions[0].label);
                onSearch(displayOptions[0].label);
                event.preventDefault();
                return;
              }
            }
          } else if (event.key === "Escape") {
            hint.current = "";
            setInputValue("");
            onSearch("");
            return;
          }

          if (inputValue === "") {
            onSearch("");
            return;
          }
        }}
        onBlur={() => {
          hint.current = "";

          if (inputValue) {
            if (
              !options.find(
                (option) =>
                  option.label.toLowerCase() === inputValue.toLowerCase()
              )
            ) {
              setInputValue("");
              onSearch("");
            } else {
              setInputValue(
                options.find(
                  (option) =>
                    option.label.toLowerCase() === inputValue.toLowerCase()
                ).label
              );
            }
          } else {
            onSearch("");
          }
        }}
        inputValue={inputValue}
        filterOptions={(options, state) => {
          const displayOptions = options.filter((option) =>
            option.label
              .toLowerCase()
              .trim()
              .includes(state.inputValue.toLowerCase().trim())
          );

          return displayOptions;
        }}
        options={options}
        getOptionLabel={(option) => option.label + " " + option.id}
        renderOption={(props, option, { inputValue }) => {
          const matches = match(option.label, inputValue, {
            insideWords: true,
          });
          const parts = parse(option.label, matches);

          return (
            <li
              {...props}
              onClick={() => {
                hint.current = "";
                setInputValue(option.label);
                if (onSearch) {
                  onSearch(option.label);
                }
              }}
            >
              <div>
                {parts.map((part, index) => (
                  <span
                    key={index}
                    style={{
                      fontWeight: part.highlight ? 700 : 400,
                    }}
                  >
                    {part.text}
                  </span>
                ))}
              </div>
            </li>
          );
        }}
        renderInput={(params) => (
          <>
            <SearchIconWrapper>
              {/* Use IconButton for clickable icon */}
              <IconButton
                sx={{ padding: 0 }}
                onClick={(event) => {
                  event.stopPropagation();

                  if (onFilterClick) {
                    onFilterClick(true);
                  }
                }}
                aria-label="search filter"
              >
                <FilterAlt />
              </IconButton>
            </SearchIconWrapper>
            <Typography
              sx={{
                position: "absolute",
                opacity: 0.5,
                left: 53,
                top: 10,
                color: "black",
              }}
            >
              {hint.current}
            </Typography>
            <StyledInputBase
              {...params}
              placeholder="Search…"
              onChange={(e) => {
                const newValue = e.target.value;
                setInputValue(newValue);

                // Find the matching option, preserving original option's casing.
                const matchingOption = options.find((option) =>
                  option.label
                    .toLowerCase()
                    .startsWith(newValue.toLowerCase().trim())
                );

                if (newValue && matchingOption) {
                  // Construct the hint text.
                  // The user's input is preserved, and the rest of the hint matches the original option's case.
                  hint.current =
                    newValue + matchingOption.label.slice(newValue.length);
                } else {
                  hint.current = "";
                }
              }}
              InputProps={{
                ...params.InputProps,
                endAdornment: inputValue ? (
                  <IconButton
                    onClick={() => {
                      setInputValue("");
                      if (onSearch) {
                        onSearch("");
                      }
                    }}
                    aria-label="clear input"
                    size="small"
                    // Ensure the clear button aligns correctly by adjusting padding and margins as needed
                    style={{ padding: "2px", marginRight: ".5em" }}
                  >
                    <ClearIcon fontSize="inherit" />
                  </IconButton>
                ) : (
                  params.InputProps.endAdornment
                ),
              }}
            />
          </>
        )}
      />
    </Search>
  );
}
