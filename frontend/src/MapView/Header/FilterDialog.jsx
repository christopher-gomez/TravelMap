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
import MultipleSelectChip, { ChipSelectMenu } from "../../Util/MultipleSelect";
import { Box, Chip, Grid, Stack } from "@mui/material";
import { FilterAlt } from "@mui/icons-material";

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

export function Filters({
  allTags,
  allDays,
  onFilterEdit,
  allCities,
  setFocusedMarker,
  setFocusedCluster,
  currentFilters,
}) {
  const [filters, setFilters] = React.useState([]);

  React.useEffect(() => {
    if (onFilterEdit) onFilterEdit(filters);
    setFocusedCluster(null);
    setFocusedMarker(null);
  }, [filters]);

  React.useEffect(() => {
    function arraysContainSameValues(arr1, arr2) {
      // Check if the arrays are the same length
      if (arr1.length !== arr2.length) {
        return false;
      }

      // Sort both arrays
      const sortedArr1 = [...arr1].sort();
      const sortedArr2 = [...arr2].sort();

      // Compare sorted arrays
      for (let i = 0; i < sortedArr1.length; i++) {
        if (sortedArr1[i] !== sortedArr2[i]) {
          return false;
        }
      }

      return true;
    }

    if (currentFilters && !arraysContainSameValues(filters, currentFilters)) {
      setFilters(currentFilters);
    }
  }, [currentFilters]);

  // const [currentFilter, setCurrentFilter] = React.useState({
  //   type: null,
  //   property: null,
  //   value: null,
  // });

  // const [addingFilterType, setAddingFilterType] = React.useState(null);
  // const [addingFilterProperty, setAddingFilterProperty] = React.useState(null);
  // const [addingTagFilterValue, setAddingTagFilterValue] = React.useState([]);

  const [tagFilters, setTagFilters] = React.useState([]);
  const [dayFilters, setDayFilters] = React.useState([]);
  const [cityFilters, setCityFilters] = React.useState([]);

  React.useEffect(() => {
    let newFilters = filters.filter((filter) => {
      return filter.property !== FILTER_PROPERTIES.tags;
    });

    if (Array.isArray(tagFilters) && tagFilters.length > 0) {
      newFilters.push({
        type: FILTER_TYPE.INCLUDE,
        property: FILTER_PROPERTIES.tags,
        value: tagFilters,
      });
    } else if (
      tagFilters !== null &&
      !Array.isArray(tagFilters) &&
      tagFilters !== ""
    ) {
      const newTagFilters = [tagFilters];
      const filterOfTags = filters.find((filter) => {
        return filter.property === FILTER_PROPERTIES.tags;
      });
      if (filterOfTags) {
        newTagFilters.push(...filterOfTags.value);
      }

      newFilters.push({
        type: FILTER_TYPE.INCLUDE,
        property: FILTER_PROPERTIES.tags,
        value: newTagFilters,
      });
    }
    setFilters(newFilters);
  }, [tagFilters]);

  React.useEffect(() => {
    let newFilters = filters.filter((filter) => {
      return filter.property !== FILTER_PROPERTIES.day;
    });

    if (Array.isArray(dayFilters) && dayFilters.length > 0) {
      newFilters.push({
        type: FILTER_TYPE.INCLUDE,
        property: FILTER_PROPERTIES.day,
        value: dayFilters,
      });
    } else if (
      dayFilters !== null &&
      !Array.isArray(dayFilters) &&
      dayFilters !== ""
    ) {
      const newDayFilters = [dayFilters];
      const filterOfDays = filters.find((filter) => {
        return filter.property === FILTER_PROPERTIES.day;
      });
      if (filterOfDays) {
        newDayFilters.push(...filterOfDays.value);
      }

      newFilters.push({
        type: FILTER_TYPE.INCLUDE,
        property: FILTER_PROPERTIES.day,
        value: newDayFilters,
      });
    }
    setFilters(newFilters);
  }, [dayFilters]);

  React.useEffect(() => {
    let newFilters = filters.filter((filter) => {
      return filter.property !== FILTER_PROPERTIES.city;
    });

    if (Array.isArray(cityFilters) && cityFilters.length > 0) {
      newFilters.push({
        type: FILTER_TYPE.INCLUDE,
        property: FILTER_PROPERTIES.city,
        value: cityFilters,
      });
    } else if (
      cityFilters !== null &&
      !Array.isArray(cityFilters) &&
      cityFilters !== ""
    ) {
      const newCityFilters = [cityFilters];
      const filterOfCities = filters.find((filter) => {
        return filter.property === FILTER_PROPERTIES.city;
      });
      if (filterOfCities) {
        newCityFilters.push(...filterOfCities.value);
      }

      newFilters.push({
        type: FILTER_TYPE.INCLUDE,
        property: FILTER_PROPERTIES.city,
        value: newCityFilters,
      });
    }
    setFilters(newFilters);
  }, [cityFilters]);

  // React.useEffect(() => {
  //   setCurrentFilter({
  //     type: addingFilterType,
  //     property: addingFilterProperty,
  //     value: addingTagFilterValue,
  //   });
  // }, [addingTagFilterValue]);

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
      <Grid
        container
        alignItems="center"
        spacing={1}
        style={{ flexWrap: "wrap" }}
      >
        {filters.length > 0 &&
          filters
            .filter((filter) => {
              return filter.property === FILTER_PROPERTIES.tags;
            })
            .map(
              (filter) =>
                filter.value.length > 0 &&
                filter.value.map((tag, index) => (
                  <Grid item>
                    <Chip
                      variant="filled"
                      sx={{ backgroundColor: "white" }}
                      key={"tag-filter-" + index}
                      label={tag}
                      onDelete={() => {
                        const tagFilter = filters.find((filter) => {
                          return filter.property === FILTER_PROPERTIES.tags;
                        });

                        if (Array.isArray(tagFilter.value)) {
                          const newTagFilters = tagFilter.value.filter(
                            (t) => t !== tag
                          );
                          setTagFilters(newTagFilters);
                        } else {
                          setTagFilters("");
                        }
                      }}
                    />
                  </Grid>
                ))
            )}
        {allTags.filter((tag) => {
          if (filters.length === 0) return true;
          else {
            return !filters.find((filter) => {
              // let oppositeType =
              //   addingFilterType === FILTER_TYPE.INCLUDE
              //     ? FILTER_TYPE.EXCLUDE
              //     : FILTER_TYPE.INCLUDE;
              return (
                filter.property === FILTER_PROPERTIES.tags &&
                // filter.type === oppositeType &&
                (Array.isArray(filter.value)
                  ? filter.value.includes(tag)
                  : filter.value === tag)
              );
            });
          }
        }).length > 0 && (
          <Grid item>
            <ChipSelectMenu
              icon={<FilterAlt />}
              options={allTags.filter((tag) => {
                if (filters.length === 0) return true;
                else {
                  return !filters.find((filter) => {
                    // let oppositeType =
                    //   addingFilterType === FILTER_TYPE.INCLUDE
                    //     ? FILTER_TYPE.EXCLUDE
                    //     : FILTER_TYPE.INCLUDE;
                    return (
                      filter.property === FILTER_PROPERTIES.tags &&
                      // filter.type === oppositeType &&
                      (Array.isArray(filter.value)
                        ? filter.value.includes(tag)
                        : filter.value === tag)
                    );
                  });
                }
              })}
              label={
                // addingFilterType === "" || addingFilterType === null
                //   ? "Filter Tags"
                //   : addingFilterType === "INCLUDE" ||
                //     addingFilterType === FILTER_TYPE.MATCH
                //   ? "Filter For Tags"
                //   : "Filter Out Tags"
                "Tags"
              }
              multiple={false}
              onChange={(val) => {
                setTagFilters(val);
              }}
              value={tagFilters}
            />
          </Grid>
        )}
        {filters.length > 0 &&
          filters
            .filter((filter) => {
              return filter.property === FILTER_PROPERTIES.day;
            })
            .map(
              (filter) =>
                filter.value.length > 0 &&
                filter.value.map((day, index) => (
                  <Grid item>
                    <Chip
                      variant="filled"
                      sx={{ backgroundColor: "white" }}
                      key={"day-filter-" + index}
                      label={"Day - " + day}
                      onDelete={() => {
                        const dayFilter = filters.find((filter) => {
                          return filter.property === FILTER_PROPERTIES.day;
                        });

                        if (Array.isArray(dayFilter.value)) {
                          const newDayFilters = dayFilter.value.filter(
                            (t) => t !== day
                          );
                          setDayFilters(newDayFilters);
                        } else {
                          setDayFilters("");
                        }
                      }}
                    />
                  </Grid>
                ))
            )}
        {allDays.filter((day) => {
          if (filters.length === 0) return true;
          else {
            return !filters.find((filter) => {
              // let oppositeType =
              //   addingFilterType === FILTER_TYPE.INCLUDE
              //     ? FILTER_TYPE.EXCLUDE
              //     : FILTER_TYPE.INCLUDE;
              return (
                filter.property === FILTER_PROPERTIES.tags &&
                // filter.type === oppositeType &&
                (Array.isArray(filter.value)
                  ? filter.value.includes(day)
                  : filter.value === day)
              );
            });
          }
        }).length > 0 && (
          <Grid item>
            <ChipSelectMenu
              icon={<FilterAlt />}
              options={allDays.filter((day) => {
                if (filters.length === 0) return true;
                else {
                  return !filters.find((filter) => {
                    // let oppositeType =
                    //   addingFilterType === FILTER_TYPE.INCLUDE
                    //     ? FILTER_TYPE.EXCLUDE
                    //     : FILTER_TYPE.INCLUDE;
                    return (
                      filter.property === FILTER_PROPERTIES.day &&
                      // filter.type === oppositeType &&
                      (Array.isArray(filter.value)
                        ? filter.value.includes(day)
                        : filter.value === day)
                    );
                  });
                }
              })}
              label={
                // addingFilterType === "" || addingFilterType === null
                //   ? "Filter Tags"
                //   : addingFilterType === "INCLUDE" ||
                //     addingFilterType === FILTER_TYPE.MATCH
                //   ? "Filter For Tags"
                //   : "Filter Out Tags"
                "Day"
              }
              multiple={false}
              onChange={(val) => {
                setDayFilters(val);
              }}
              value={dayFilters}
            />
          </Grid>
        )}
        {filters.length > 0 &&
          filters
            .filter((filter) => {
              return filter.property === FILTER_PROPERTIES.city;
            })
            .map(
              (filter) =>
                filter.value.length > 0 &&
                filter.value.map((city, index) => (
                  <Grid item>
                    <Chip
                      variant="filled"
                      sx={{ backgroundColor: "white" }}
                      key={"city-filter-" + index}
                      label={city}
                      onDelete={() => {
                        const cityFilter = filters.find((filter) => {
                          return filter.property === FILTER_PROPERTIES.city;
                        });

                        if (Array.isArray(cityFilter.value)) {
                          const newCityFilters = cityFilter.value.filter(
                            (t) => t !== city
                          );
                          setCityFilters(newCityFilters);
                        } else {
                          setCityFilters("");
                        }
                      }}
                    />
                  </Grid>
                ))
            )}
        {allCities.filter((city) => {
          if (filters.length === 0) return true;
          else {
            return !filters.find((filter) => {
              // let oppositeType =
              //   addingFilterType === FILTER_TYPE.INCLUDE
              //     ? FILTER_TYPE.EXCLUDE
              //     : FILTER_TYPE.INCLUDE;
              return (
                filter.property === FILTER_PROPERTIES.city &&
                // filter.type === oppositeType &&
                (Array.isArray(filter.value)
                  ? filter.value.includes(city)
                  : filter.value === city)
              );
            });
          }
        }).length > 0 && (
          <Grid item>
            <ChipSelectMenu
              icon={<FilterAlt />}
              options={allCities.filter((city) => {
                if (filters.length === 0) return true;
                else {
                  return !filters.find((filter) => {
                    // let oppositeType =
                    //   addingFilterType === FILTER_TYPE.INCLUDE
                    //     ? FILTER_TYPE.EXCLUDE
                    //     : FILTER_TYPE.INCLUDE;
                    return (
                      filter.property === FILTER_PROPERTIES.city &&
                      // filter.type === oppositeType &&
                      (Array.isArray(filter.value)
                        ? filter.value.includes(city)
                        : filter.value === city)
                    );
                  });
                }
              })}
              label={
                // addingFilterType === "" || addingFilterType === null
                //   ? "Filter Tags"
                //   : addingFilterType === "INCLUDE" ||
                //     addingFilterType === FILTER_TYPE.MATCH
                //   ? "Filter For Tags"
                //   : "Filter Out Tags"
                "City"
              }
              multiple={false}
              onChange={(val) => {
                setCityFilters(val);
              }}
              value={cityFilters}
            />
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
