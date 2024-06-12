import * as React from "react";
import { styled, alpha } from "@mui/material/styles";
import InputBase from "@mui/material/InputBase";
import FilterAlt from "@mui/icons-material/FilterAlt";
import { Box, IconButton, Popper, TextField, Typography } from "@mui/material";
import "./SearchBar.css";
import Autocomplete from "@mui/material/Autocomplete";
import parse from "autosuggest-highlight/parse";
import match from "autosuggest-highlight/match";
import ClearIcon from "@mui/icons-material/Clear";
import { Global } from "@emotion/react";
import {
  ArrowBack,
  ArrowForward,
  LocationSearching,
} from "@mui/icons-material";
import { useStackNavigation } from "../../Util/StackNavigation";

const Search = styled("div")(({ theme, useBoxShadow, isFocused }) => ({
  position: "relative",
  borderRadius: theme.shape.borderRadius,
  border:
    "5px solid #ffee00 !important" /* Gold border for a touch of vibrancy */,
  borderBottom: isFocused
    ? "5px solid transparent !important"
    : "5px solid #ffee00 !important" /* Gold border for a touch of vibrancy */,
  backgroundColor: isFocused
    ? alpha(theme.palette.common.white, 1)
    : "rgba(255, 255, 255, 0.85)" /* Slightly transparent */,
  backdropFilter: "blur(10px)",
  marginLeft: 0,
  // marginTop: '1em',
  width: "100%",
  borderRadius: isFocused ? "1em 1em 0 0" : "5em",
  transition: theme.transitions.create(["width", "margin", "background-color"]),
  [theme.breakpoints.up("sm")]: {
    // marginLeft: theme.spacing(2),
    width: "auto",
    minWidth: "376px",
    // transition: theme.transitions.create("width"),
    "&:hover": {
      backgroundColor: alpha(theme.palette.common.white, 1),
    },
  },
  [theme.breakpoints.down("md")]: {
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1),
  },
  boxShadow: true
    ? "0px 2px 15px 2px rgba(0, 0, 0, 0.6)"
    : "0px 10px 5px 0px rgba(0, 0, 0, 0.3)",
  // marginTop: "10px",
  zIndex: 10000000000,
  "& > .MuiAutocomplete-root": {
    backgroundColor: "transparent !important",
  },
}));

const SearchIconWrapper = styled("div")(({ theme }) => ({
  padding: theme.spacing(0),
  height: "100%",
  // position: "absolute",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "black",
  cursor: "pointer",
  zIndex: 2,
}));

const StyledInputBase = styled(TextField)(({ theme, isFocused }) => ({
  color: "black",
  backgroundColor: "transparent !important",
  "& .MuiOutlinedInput-root": {
    border: "none !important",
    backgroundColor: "transparent !important",
  },
  "& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline": {
    border: "none !important",
  },
  "& .MuiInputBase-root": {
    fontFamily: `"Fredoka", sans-serif !important`,
    width: "100% !important",
    padding: "0px !important",
    borderRadius: isFocused ? "5em 5em 0 0" : "5em",
    // vertical padding + font size from searchIcon
    // paddingLeft: `calc(1em + ${theme.spacing(4)}) !important`,
    transition: theme.transitions.create("width"),
    [theme.breakpoints.up("sm")]: {
      width: "12ch",
      "&:focus": {
        width: "20ch",
      },
    },
  },
}));

const CustomPopper = styled(Popper)(({ theme }) => ({
  zIndex: "1 !important",
  width: "102.65% !important",
  "& .MuiPaper-root": {
    zIndex: "1 !important",
    border:
      "5px solid #ffee00 !important" /* Gold border for a touch of vibrancy */,
    borderTop: "0px solid transparent !important",
    boxShadow: true ? "0px 2px 5px 0px rgba(0, 0, 0, 0.2)" : "none",
    borderRadius: "0 0 1em 1em",
    width: "100%",
    position: "absolute",
    left: "50%", // Position the left edge of the popper at the center of the parent
    transform: "translateX(-56.45%)", // Shift the popper to the left by half its width
    fontFamily: `"Fredoka", sans-serif !important`,
    fontWeight: 500,
    "> .MuiAutocomplete-listbox": {
      "&::-webkit-scrollbar": {
        WebkitAppearance: "none",
        width: "8px",
      },
      "&::-webkit-scrollbar-track": {
        background: "rgba(255, 255, 255, 0.103)" /* Slightly transparent */,
      },

      "&::-webkit-scrollbar-thumb": {
        background: "#adadad4e",
        borderRadius: "6px",
      },

      "&:hover::-webkit-scrollbar-thumb": {
        background: "#a7a7a7",
      },
    },
  },
}));

export default function SearchBar({
  markers,
  onSearch,
  onFilterClick,
  focusedMarker,
  focusedCluster,
  cities,
  tags,
  times,
  days,
  suggestingFor,
  currentDayFilter,
}) {
  const hint = React.useRef("");
  const [inputValue, setInputValue] = React.useState("");

  const { back, forward, canGoBack, canGoForward, current, moveForwardToBack } =
    useStackNavigation();

  React.useEffect(() => {
    if (focusedMarker) {
      setInputValue(focusedMarker.info);
    } else if (focusedCluster) {
      if (!suggestingFor) setInputValue("Multiple Activities");
      else
        setInputValue(
          "Suggested Activities Near " +
            (suggestingFor.markers
              ? suggestingFor.markers.map((m, i) => {
                  if (i === suggestingFor.markers.length - 1)
                    return " and " + m.info;
                  else return i === 0 ? m.info : ", " + m.info;
                })
              : suggestingFor.day
              ? "Day " + suggestingFor.day + " Activities"
              : suggestingFor.info)
        );
    } else {
      setInputValue("");
    }
  }, [focusedMarker, focusedCluster]);

  const [inputFocused, setInputFocused] = React.useState(false);

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
    id: "marker-" + i,
  }));

  if (cities)
    options.push(
      ...cities.map((city, i) => ({ label: "City: " + city, id: "city-" + i }))
    );
  if (tags)
    options.push(
      ...tags.map((tag, i) => ({ label: "Tag: " + tag, id: "tag-" + i }))
    );
  if (times)
    options.push(
      ...times.map((time, i) => ({ label: "Time: " + time, id: "time-" + i }))
    );
  if (days)
    options.push(
      ...days
        .filter((day) => day !== currentDayFilter)
        .map((day, i) => ({ label: "Day: " + day, id: "day-" + i }))
    );

  options.sort((a, b) => {
    if (a.label < b.label) {
      return -1;
    }
    if (a.label > b.label) {
      return 1;
    }
    return 0;
  });

  const [open, setOpen] = React.useState(false);

  const inputRef = React.useRef();

  return (
    <Search useBoxShadow={!inputFocused && !open} isFocused={inputFocused}>
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
                  .toString()
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
        PopperComponent={CustomPopper}
        onBlur={() => {
          hint.current = "";

          if (inputValue === "") return;

          if (inputValue) {
            if (
              !options.find(
                (option) =>
                  option.label.toLowerCase() === inputValue.toLowerCase()
              )
            ) {
              // setInputValue("");
              // onSearch("");
            } else {
              setInputValue(
                options.find(
                  (option) =>
                    option.label.toLowerCase() === inputValue.toLowerCase()
                ).label
              );
            }
          }
          //  else {
          //   onSearch("");
          // }
        }}
        onOpen={() => {
          setOpen(true);
          // setInputFocused(true);
        }}
        onClose={() => {
          // setOpen(false);
        }}
        componentsProps={{
          popper: {
            open: open,
          },
        }}
        open={open}
        inputValue={inputValue}
        filterOptions={(options, state) => {
          const displayOptions = options.filter((option) =>
            option.label
              .toString()
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
              style={{
                fontFamily: `"Fredoka", sans-serif !important`,
              }}
              onClick={() => {
                hint.current = "";
                setInputValue(option.label);
                if (onSearch) {
                  onSearch(option.label);
                }

                setInputFocused(false);
                setOpen(false);
              }}
            >
              <div
                style={{
                  fontFamily: `"Fredoka", sans-serif !important`,
                }}
              >
                {parts.map((part, index) => (
                  <span
                    key={index}
                    style={{
                      fontWeight: part.highlight ? 700 : 400,
                      fontFamily: `"Fredoka", sans-serif !important`,
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
          <Box sx={{ display: "flex" }}>
            <SearchIconWrapper>
              {(!canGoBack && !canGoForward) || inputFocused ? (
                <Box
                  sx={{
                    display: "flex",
                    flexFlow: "row",
                    flex: "0 1 auto",
                    placeItems: "center",
                    placeContent: "center",
                  }}
                >
                  <IconButton sx={{ pl: 2, pr: 1 }}>
                    <LocationSearching />
                  </IconButton>
                </Box>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    flexFlow: "row",
                    flex: "0 1 auto",
                    placeItems: "center",
                    placeContent: "center",
                  }}
                >
                  <IconButton
                    disabled={!canGoBack}
                    sx={{ pr: 0 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      back();
                    }}
                  >
                    <ArrowBack />
                  </IconButton>
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      forward();
                    }}
                    disabled={!canGoForward}
                    sx={{
                      pl: 0,
                      pr: 0,
                    }}
                  >
                    <ArrowForward />
                  </IconButton>
                </Box>
              )}
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
              sx={{ flex: "1 1 auto" }}
              {...params}
              onFocus={() => {
                setInputFocused(true);
                setOpen(true);
              }}
              onBlur={() => {
                setInputFocused(false);
                setOpen(false);
              }}
              // isFocused={inputFocused}
              placeholder="Search…"
              onChange={(e) => {
                if (!inputFocused) return;

                const newValue = e.target.value;
                setInputValue(newValue);

                // Find the matching option, preserving original option's casing.
                const matchingOption = options.find((option) =>
                  option.label
                    .toString()
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
              ref={inputRef}
              InputProps={{
                ...params.InputProps,

                endAdornment: inputValue ? (
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      hint.current = "";
                      setInputValue("");
                      if (onSearch) {
                        onSearch("");
                      }

                      moveForwardToBack();
                    }}
                    aria-label="clear input"
                    size="small"
                    // Ensure the clear button aligns correctly by adjusting padding and margins as needed
                    style={{ padding: "2px", marginRight: ".5em" }}
                  >
                    <ClearIcon fontSize="inherit" />
                  </IconButton>
                ) : null,
              }}
            />
          </Box>
        )}
        disablePortal
      />
    </Search>
  );
}
