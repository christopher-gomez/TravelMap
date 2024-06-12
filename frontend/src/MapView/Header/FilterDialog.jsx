import * as React from "react";
import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import MultipleSelectChip, { ChipSelectMenu } from "../../Util/MultipleSelect";
import { Box, Chip, Grid, Stack } from "@mui/material";
import { FilterAlt } from "@mui/icons-material";
import { objArraysEqual } from "../../Util/Utils";
import { ItinerarySuggestions } from "../MiscComponents/ItinerarySuggestions";

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": {
    padding: theme.spacing(2),
    minWidth: "300px",
  },
  "& .MuiDialogActions-root": {
    padding: theme.spacing(1),
  },
}));

export const FILTER_TYPE = {
  INCLUDE: "INCLUDE",
  EXCLUDE: "EXCLUDE",
  MATCH: "MATCH",
};

export const FILTER_PROPERTIES = {
  tags: "tags",
  day: "day",
  city: "city",
  time: "time",
};

export default function FilterDialog({
  open,
  setOpen,
  allTags,
  allDays,
  onFilterEdit,
}) {
  const [filters, setFilters] = React.useState([]);
  const [addingFilter, setAddingFilter] = React.useState(filters.length === 0);

  React.useEffect(() => {
    if (filters.length === 0) {
      setAddingFilter(true);
    }
  }, [filters, open]);

  React.useEffect(() => {
    if (!open && onFilterEdit !== undefined) {
      onFilterEdit(filters);
    }
  }, [open]);

  React.useEffect(() => {
    if (!addingFilter) {
      setAddingFilterType("");
      setAddingFilterProperty("");
      setAddingFilterValue([]);
    }
  }, [addingFilter]);

  const [currentFilter, setCurrentFilter] = React.useState({
    type: null,
    property: null,
    value: null,
  });

  const [addingFilterType, setAddingFilterType] = React.useState(null);
  const [addingFilterProperty, setAddingFilterProperty] = React.useState(null);
  const [addingFilterValue, setAddingFilterValue] = React.useState([]);

  React.useEffect(() => {
    setCurrentFilter({
      type: addingFilterType,
      property: addingFilterProperty,
      value: addingFilterValue,
    });
  }, [addingFilterType, addingFilterProperty, addingFilterValue]);

  const handleClose = () => {
    setAddingFilterProperty("");
    setAddingFilterType("");
    setAddingFilterValue([]);
    setAddingFilter(false);
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
        {addingFilter ? "Add Filter" : "Filters"}
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
        {filters.length > 0 && !addingFilter && (
          <div>
            {filters.map((filter, index) => (
              <div key={index}>
                <p>Filter {index + 1}</p>
                <p>
                  {filter.type} {filter.property} with:{" "}
                  {Array.isArray(filter.value)
                    ? filter.value.length > 1
                      ? "[" + filter.value.join(", ") + "]"
                      : filter.value[0]
                    : filter.value}
                </p>
              </div>
            ))}
          </div>
        )}
        {addingFilter && (
          <div>
            <div style={{ display: "flex", alignContent: "center" }}>
              <MultipleSelectChip
                options={["", ...Object.values(FILTER_TYPE)]}
                label={"Type"}
                multiple={false}
                onChange={(val) => {
                  if (val === "") setAddingFilterType(null);
                  else setAddingFilterType(val);
                }}
                value={addingFilterType}
              />
              <MultipleSelectChip
                labels={[
                  "",
                  ...Object.values(FILTER_PROPERTIES).filter((property) => {
                    if (property === FILTER_PROPERTIES.tags) {
                      return (
                        allTags.length > 0 &&
                        (addingFilterType !== FILTER_TYPE.MATCH ||
                          filters.length === 0 ||
                          !filters.find(
                            (filter) =>
                              filter.property === FILTER_PROPERTIES.tags
                          )) &&
                        (filters.length === 0 ||
                          !filters.find((filter) => {
                            return (
                              (filter.type === addingFilterType ||
                                filter.type === FILTER_TYPE.MATCH) &&
                              filter.property === FILTER_PROPERTIES.tags
                            );
                          }))
                      );
                    } else if (property === FILTER_PROPERTIES.day) {
                      return (
                        allDays.length > 0 &&
                        (addingFilterType !== FILTER_TYPE.MATCH ||
                          filters.length === 0 ||
                          !filters.find(
                            (filter) =>
                              filter.property === FILTER_PROPERTIES.day
                          )) &&
                        (filters.length === 0 ||
                          !filters.find((filter) => {
                            return (
                              (filter.type === addingFilterType ||
                                filter.type === FILTER_TYPE.MATCH) &&
                              filter.property === FILTER_PROPERTIES.day
                            );
                          }))
                      );
                    } else {
                      return true;
                    }
                  }),
                ].map((property) => {
                  if (property === FILTER_PROPERTIES.tags) {
                    return "Tags";
                  } else if (property === FILTER_PROPERTIES.day) {
                    return "Day";
                  } else {
                    return property;
                  }
                })}
                options={[
                  "",
                  ...Object.values(FILTER_PROPERTIES).filter((property) => {
                    if (property === FILTER_PROPERTIES.tags) {
                      return (
                        allTags.length > 0 &&
                        (addingFilterType !== FILTER_TYPE.MATCH ||
                          filters.length === 0 ||
                          !filters.find(
                            (filter) =>
                              filter.property === FILTER_PROPERTIES.tags
                          )) &&
                        (filters.length === 0 ||
                          !filters.find((filter) => {
                            return (
                              (filter.type === addingFilterType ||
                                filter.type === FILTER_TYPE.MATCH) &&
                              filter.property === FILTER_PROPERTIES.tags
                            );
                          }))
                      );
                    } else if (property === FILTER_PROPERTIES.day) {
                      return (
                        allDays.length > 0 &&
                        (addingFilterType !== FILTER_TYPE.MATCH ||
                          filters.length === 0 ||
                          !filters.find(
                            (filter) =>
                              filter.property === FILTER_PROPERTIES.day
                          )) &&
                        (filters.length === 0 ||
                          !filters.find((filter) => {
                            return (
                              (filter.type === addingFilterType ||
                                filter.type === FILTER_TYPE.MATCH) &&
                              filter.property === FILTER_PROPERTIES.day
                            );
                          }))
                      );
                    } else {
                      return true;
                    }
                  }),
                ]}
                label={"Property"}
                multiple={false}
                onChange={(val) => {
                  if (val === "") setAddingFilterProperty(null);
                  else setAddingFilterProperty(val);
                }}
                value={addingFilterProperty}
              />
            </div>
            <div
              style={{
                display: "flex",
                alignContent: "center",
                alignItems: "center",
                justifyContent: "center",
                justifyItems: "center",
              }}
            >
              {(addingFilterProperty === null ||
                addingFilterProperty === "") && (
                <MultipleSelectChip
                  disabled={true}
                  label={"Value"}
                  options={[]}
                />
              )}
              {addingFilterProperty === FILTER_PROPERTIES.tags &&
                allTags.length > 0 && (
                  <MultipleSelectChip
                    options={allTags.filter((tag) => {
                      if (filters.length === 0) return true;
                      else {
                        return !filters.find((filter) => {
                          let oppositeType =
                            addingFilterType === FILTER_TYPE.INCLUDE
                              ? FILTER_TYPE.EXCLUDE
                              : FILTER_TYPE.INCLUDE;
                          return (
                            filter.property === FILTER_PROPERTIES.tags &&
                            filter.type === oppositeType &&
                            (Array.isArray(filter.value)
                              ? filter.value.includes(tag)
                              : filter.value === tag)
                          );
                        });
                      }
                    })}
                    label={
                      addingFilterType === "" || addingFilterType === null
                        ? "Filter Tags"
                        : addingFilterType === "INCLUDE" ||
                          addingFilterType === FILTER_TYPE.MATCH
                        ? "Filter For Tags"
                        : "Filter Out Tags"
                    }
                    multiple={true}
                    onChange={(val) => {
                      setAddingFilterValue(val);
                    }}
                    value={addingFilterValue}
                  />
                )}
              {addingFilterProperty === FILTER_PROPERTIES.day &&
                allDays.length > 0 && (
                  <MultipleSelectChip
                    multiple={true}
                    options={allDays.filter((day) => {
                      if (
                        addingFilterType === FILTER_TYPE.MATCH &&
                        addingFilterValue.includes("All") &&
                        day !== "All"
                      )
                        return false;
                      else if (
                        addingFilterType === FILTER_TYPE.MATCH &&
                        addingFilterValue.includes("General") &&
                        day !== "General"
                      )
                        return false;
                      else if (
                        addingFilterType === FILTER_TYPE.MATCH &&
                        addingFilterValue.length > 0 &&
                        !addingFilterValue.includes("All") &&
                        day === "All"
                      )
                        return false;
                      else if (
                        addingFilterType === FILTER_TYPE.MATCH &&
                        addingFilterValue.length > 0 &&
                        !addingFilterValue.includes("General") &&
                        day === "General"
                      )
                        return false;

                      if (
                        addingFilterType !== FILTER_TYPE.MATCH &&
                        day === "All"
                      )
                        return false;

                      if (filters.length === 0) return true;
                      else {
                        return !filters.find((filter) => {
                          let oppositeType =
                            addingFilterType === FILTER_TYPE.INCLUDE
                              ? FILTER_TYPE.EXCLUDE
                              : FILTER_TYPE.INCLUDE;
                          return (
                            filter.property === FILTER_PROPERTIES.day &&
                            filter.type === oppositeType &&
                            (Array.isArray(filter.value)
                              ? filter.value.includes(day)
                              : filter.value === day)
                          );
                        });
                      }
                    })}
                    labels={allDays
                      .filter((day) => {
                        if (
                          addingFilterType === FILTER_TYPE.MATCH &&
                          addingFilterValue.includes("All") &&
                          day !== "All"
                        )
                          return false;
                        else if (
                          addingFilterType === FILTER_TYPE.MATCH &&
                          addingFilterValue.includes("General") &&
                          day !== "General"
                        )
                          return false;
                        else if (
                          addingFilterType === FILTER_TYPE.MATCH &&
                          addingFilterValue.length > 0 &&
                          !addingFilterValue.includes("All") &&
                          day === "All"
                        )
                          return false;
                        else if (
                          addingFilterType === FILTER_TYPE.MATCH &&
                          addingFilterValue.length > 0 &&
                          !addingFilterValue.includes("General") &&
                          day === "General"
                        )
                          return false;

                        if (
                          addingFilterType === FILTER_TYPE.MATCH &&
                          addingFilterValue.includes("All") &&
                          day !== "All"
                        )
                          return false;

                        if (
                          addingFilterType !== FILTER_TYPE.MATCH &&
                          day === "All"
                        )
                          return false;
                        if (filters.length === 0) return true;
                        else {
                          return !filters.find((filter) => {
                            let oppositeType =
                              addingFilterType === FILTER_TYPE.INCLUDE
                                ? FILTER_TYPE.EXCLUDE
                                : FILTER_TYPE.INCLUDE;
                            return (
                              filter.property === FILTER_PROPERTIES.day &&
                              filter.type === oppositeType &&
                              (Array.isArray(filter.value)
                                ? filter.value.includes(day)
                                : filter.value === day)
                            );
                          });
                        }
                      })
                      .map((day) =>
                        day !== "All" && day !== "General" ? "Day " + day : day
                      )}
                    label={
                      addingFilterType === null || addingFilterType === ""
                        ? "Filter Days"
                        : addingFilterType === FILTER_TYPE.INCLUDE ||
                          addingFilterType === FILTER_TYPE.MATCH
                        ? "Filter For Days"
                        : "Filter Out Days"
                    }
                    onChange={(val) => {
                      setAddingFilterValue(val);
                    }}
                    value={addingFilterValue}
                  />
                )}
            </div>
          </div>
        )}
      </DialogContent>
      <DialogActions>
        {filters.length > 0 && !addingFilter && (
          <Button
            onClick={() => {
              setFilters([]);
              setAddingFilter(true);
            }}
          >
            Clear Filters
          </Button>
        )}
        {addingFilter &&
          (addingFilterProperty !== null ||
            addingFilterType !== null ||
            addingFilterValue.length > 0) && (
            <Button
              disabled={
                filters.length === 0 &&
                (!addingFilterProperty || addingFilterProperty === "") &&
                (!addingFilterType || addingFilterType === "") &&
                addingFilterValue.length === 0
              }
              onClick={() => {
                if (filters.length === 0) {
                  setAddingFilterProperty("");
                  setAddingFilterType("");
                  setAddingFilterValue([]);
                } else setAddingFilter(false);
                // if (filters.length === 0) {
                //   handleClose();
                // }
              }}
            >
              Cancel
            </Button>
          )}
        {!addingFilter && (
          <Button
            onClick={() => {
              setAddingFilter(true);
            }}
          >
            Add Filter
          </Button>
        )}
        {addingFilter && (
          <Button
            autoFocus
            disabled={
              addingFilterType === null ||
              addingFilterProperty === null ||
              addingFilterValue.length === 0
            }
            onClick={() => {
              setFilters([...filters, currentFilter]);
              setAddingFilter(false);
            }}
          >
            Save changes
          </Button>
        )}
      </DialogActions>
    </BootstrapDialog>
  );
}

const StyledGrid = styled(Grid)(({ theme }) => ({
  display: "flex",
  placeItems: "center",
  flexWrap: "wrap",
  
  "@media (max-width: 600px)": {
    placeContent: "center",
  },

  "@media (min-width: 600px)": {
    placeContent: "flex-start",
  }
}));

export function Filters({
  allTags,
  allDays,
  allTimes,
  onFilterEdit,
  allCities,
  setFocusedMarker,
  setFocusedCluster,
  currentFilters,
  focusedCluster,
  timelineActivities,
  focusedActivity,
  mapsService,
  onActivityClick,
  allMarkers,
  onSetSuggested,
  onActivityMouseOver,
  onActivityMouseOut,
  placesService,
  createOverlay,
  geocoderService,
  googleAccount,
  setLoginPopupOpen,
  onSetSuggesting,
  suggestingFor,
}) {
  const [filters, setFilters] = React.useState([]);
  const filterRef = React.useRef(filters);

  React.useEffect(() => {
    if (objArraysEqual(filters, filterRef.current)) return;

    filterRef.current = filters;

    if (onFilterEdit) onFilterEdit(filters);
    setFocusedCluster(null);
    setFocusedMarker(null);
  }, [filters]);

  React.useEffect(() => {
    if (currentFilters && !objArraysEqual(filters, currentFilters)) {
      setFilters(currentFilters);
    }
  }, [currentFilters]);

  // const [tagFilters, setTagFilters] = React.useState([]);
  // const [dayFilters, setDayFilters] = React.useState([]);
  // const [cityFilters, setCityFilters] = React.useState([]);
  // const [timeFilters, setTimeFilters] = React.useState([]);

  const setFilterTypeFromProperty = (property, value) => {
    let newFilters = filters.filter((filter) => {
      return filter.property !== property;
    });

    if (Array.isArray(value)) {
      newFilters.push({
        type: FILTER_TYPE.INCLUDE,
        property: property,
        value: value,
      });
    } else if (value !== null && !Array.isArray(value) && value !== "") {
      const newPropertyFilters = [value];
      const filterOfProperty = filters.find((filter) => {
        return filter.property === property;
      });
      if (filterOfProperty) {
        newPropertyFilters.push(...filterOfProperty.value);
      }

      newFilters.push({
        type: FILTER_TYPE.INCLUDE,
        property: property,
        value: newPropertyFilters,
      });
    }

    setFilters(newFilters);
  };

  React.useEffect(() => {
    return () => {
      setFilters([]);
    };
  }, []);

  const renderChipFilter = (property) => {
    if (focusedActivity || focusedCluster) return null;

    let targetStateUpdate;
    let targetState;
    targetState = filters.find((filter) => {
      return filter.property === property;
    });

    if (!targetState) targetState = [];
    else targetState = targetState.value;

    targetStateUpdate = (value) => {
      setFilterTypeFromProperty(property, value);
    };

    let selectedChips = null;

    if (filters.length > 0)
      selectedChips = filters
        .filter((filter) => {
          return filter.property === property;
        })
        .map(
          (filter) =>
            filter.value.length > 0 &&
            filter.value.map((propVal, index) => (
              <Grid item key={property + "-filter-grid-item-" + index}>
                <Chip
                  variant="filled"
                  sx={{
                    backgroundColor: "white",
                    boxShadow: "0px 1px 10px 0px rgba(0, 0, 0, 0.5)",
                  }}
                  key={property + "-filter-grid-item-chip-" + index}
                  label={
                    property.charAt(0).toUpperCase() +
                    property.slice(1) +
                    " - " +
                    propVal
                  }
                  onDelete={() => {
                    const propertyFilter = filters.find((filter) => {
                      return filter.property === property;
                    });

                    if (Array.isArray(propertyFilter.value)) {
                      const newPropertyFilters = propertyFilter.value.filter(
                        (t) => t !== propVal
                      );
                      if (newPropertyFilters.length > 0) {
                        targetStateUpdate(newPropertyFilters);
                      } else {
                        targetStateUpdate("");
                      }
                    } else {
                      targetStateUpdate("");
                    }
                  }}
                />
              </Grid>
            ))
        );

    let chipSelectMenu = null;

    let targetPropertyValues = null;

    switch (property) {
      case FILTER_PROPERTIES.tags:
        targetPropertyValues = allTags;
        break;
      case FILTER_PROPERTIES.day:
        targetPropertyValues = allDays;
        break;
      case FILTER_PROPERTIES.city:
        targetPropertyValues = allCities;
        break;
      case FILTER_PROPERTIES.time:
        targetPropertyValues = allTimes;
        break;
      default:
        targetPropertyValues = null;
        break;
    }

    if (targetPropertyValues !== null && targetPropertyValues.length > 0) {
      let unselectedPropertyValues = targetPropertyValues.filter((propVal) => {
        if (filters.length === 0) return true;
        else {
          return !filters.find((filter) => {
            return (
              filter.property === property &&
              (Array.isArray(filter.value)
                ? filter.value.includes(propVal)
                : filter.value === propVal)
            );
          });
        }
      });

      if (unselectedPropertyValues && unselectedPropertyValues.length > 0) {
        chipSelectMenu = (
          <Grid item>
            <ChipSelectMenu
              icon={<FilterAlt />}
              options={unselectedPropertyValues}
              label={property.charAt(0).toUpperCase() + property.slice(1)}
              multiple={false}
              onChange={(val) => {
                targetStateUpdate(val);
              }}
              value={targetState}
            />
          </Grid>
        );
      }
    }

    return (
      <>
        {selectedChips}
        {chipSelectMenu}
      </>
    );
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexFlow: "row",
        justifyContent: "center",
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <StyledGrid
        container
        alignItems="center"
        spacing={1}
      >
        {!suggestingFor &&
          (focusedActivity ||
            focusedCluster ||
            (timelineActivities && timelineActivities.length > 0)) && (
            <Grid item>
              <ItinerarySuggestions
                timelineActivities={timelineActivities}
                focusedActivity={focusedActivity}
                focusedCluster={focusedCluster}
                mapsService={mapsService}
                onActivityClick={onActivityClick}
                allMarkers={allMarkers}
                onSetSuggested={onSetSuggested}
                onActivityMouseOver={onActivityMouseOver}
                onActivityMouseOut={onActivityMouseOut}
                placesService={placesService}
                createOverlay={createOverlay}
                geocoderService={geocoderService}
                googleAccount={googleAccount}
                setLoginPopupOpen={setLoginPopupOpen}
                onSetSuggesting={onSetSuggesting}
              />
            </Grid>
          )}
        {/* Days */}
        {renderChipFilter(FILTER_PROPERTIES.day)}
        {/* Times */}
        {renderChipFilter(FILTER_PROPERTIES.time)}
        {/* Cities */}
        {renderChipFilter(FILTER_PROPERTIES.city)}
        {/* Tags */}
        {renderChipFilter(FILTER_PROPERTIES.tags)}
      </StyledGrid>
    </Box>
  );
}
