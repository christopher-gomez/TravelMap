import {
  Add,
  ArrowBack,
  ArrowBackIos,
  ArrowForward,
  ArrowForwardIos,
  Cancel,
  Close,
  Delete,
  ExpandMore,
  ForkLeft,
  Star,
} from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  Grid,
  IconButton,
  List,
  ListItem,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { FILTER_PROPERTIES, FILTER_TYPE } from "./Header/FilterDialog";
import Timeline from "../Util/Timeline";
import {
  createMarkersFromPOIs,
  findNearbyMarkers,
  findPlacesOfInterest,
  isElementOverflowing,
} from "../Util/Utils";
import InputSlider from "../Util/InputSlider";
import { ChipSelectMenu } from "../Util/MultipleSelect";

export const timeOrder = {
  Morning: 0,
  "All Day": 1,
  Afternoon: 2,
  Evening: 3,
  Night: 4,
};

export const timeOverrideKeys = {
  0: "All Day",
  1: "Morning",
  2: "Afternoon",
  3: "Evening",
  4: "Night",
};

const suggestLocationDefaultTypes = [
  "amusement_park",
  "aquarium",
  "art_gallery",
  "bakery",
  "bar",
  "cafe",
  "casino",
  "department_store",
  "museum",
  "night_club",
  "park",
  "restaurant",
  "shopping_mall",
  "spa",
  "stadium",
  "tourist_attraction",
  "zoo",
];

export default function ItineraryTimeline({
  timelineActivities,
  focusedActivity,
  directionsRenderer,
  directionsService,
  mapsService,
  map,
  currentDayFilter,
  allDays,
  markerPropertyFilters,
  setMarkerPropertyFilters,
  onActivityClick,
  allMarkers,
  onSetSuggested,
  onActivityMouseOver,
  onActivityMouseOut,
  open,
  onSetOpen,
  placesService,
  createOverlay,
  geocoderService,
  englishDate,
  googleAccount,
  setLoginPopupOpen,
  onSetSuggesting,
}) {
  const [timelineOpen, setTimelineOpen] = useState(true);

  useEffect(() => {
    if (open !== undefined) setTimelineOpen(open);
  }, [open]);

  useEffect(() => {
    if (onSetOpen && timelineOpen !== open) onSetOpen(timelineOpen);
  }, [timelineOpen]);

  const [routing, setRouting] = useState(false);
  const [routingData, setRoutingData] = useState([]);

  const [routeDriveTime, setRouteDriveTime] = useState(null);
  const [routeDriveDistance, setRouteDriveDistance] = useState(null);
  const [routeWalkTime, setRouteWalkTime] = useState(null);
  const [routeWalkDistance, setRouteWalkDistance] = useState(null);

  const [suggesting, setSuggesting] = useState(false);
  const [suggestRadius, setSuggestRadius] = useState(1000);
  const [suggestedActivities, setSuggestedActivities] = useState([]);
  const [suggestedTypes, setSuggestedTypes] = useState(
    suggestLocationDefaultTypes
  );
  const [filterNonLatin, setFilterNonLatin] = useState(true);
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [fetchingNearby, setFetchingNearby] = useState(false);
  const [usingGooglePOIs, setUsingGooglePOIs] = useState(false);
  const [noLocationsNearby, setNoLocationsNearby] = useState(false);

  function suggestNearby() {
    setFetchingNearby(true);
    let nearbyMarkers = [];
    const target =
      timelineActivities && timelineActivities.length > 0
        ? timelineActivities
        : focusedActivity
        ? [focusedActivity]
        : [];

    nearbyMarkers = findNearbyMarkers(
      target,
      allMarkers,
      mapsService,
      suggestRadius
    );

    if (timelineActivities && timelineActivities.length > 0)
      nearbyMarkers = nearbyMarkers.filter((m) => !m.date);

    findPlacesOfInterest(
      target,
      allMarkers,
      placesService,
      async (nearby) => {
        const markers = await createMarkersFromPOIs(
          nearby,
          mapsService,
          geocoderService,
          createOverlay,
          onActivityMouseOver,
          onActivityMouseOut,
          onActivityClick
        );
        markers.sort((a, b) => {
          if (a.rating === undefined) return 1; // Move a to the end if it lacks ratings
          if (b.rating === undefined) return -1; // Move b to the end if it lacks ratings
          return b.rating - a.rating;
        });

        const final = [...nearbyMarkers, ...markers];
        if (final.length === 0) {
          setNoLocationsNearby(true);
        } else {
          setNoLocationsNearby(false);
        }

        setSuggestedActivities(final);
      },
      suggestRadius,
      suggestedTypes,
      timelineActivities && timelineActivities.length > 0,
      filterNonLatin,
      googleAccount
    );

    // setSuggestedActivities(nearbyMarkers);
  }

  // useEffect(() => {
  //   if (settingsDirty) {
  //     // suggestNearby();
  //   } else
  // }, [settingsDirty]);

  useEffect(() => {
    if (suggesting) {
      if (suggestedActivities.length === 0 && !noLocationsNearby)
        suggestNearby();
      else setSettingsDirty(true);
    }
  }, [suggestRadius, suggestedTypes, filterNonLatin, usingGooglePOIs]);

  useEffect(() => {
    if (!suggesting) {
      setSuggestedActivities([]);
      // setSuggestRadius(1000);
      setFetchingNearby(false);
      setSettingsDirty(false);
      setSettingsOpen(false);
      setNoLocationsNearby(false);
    }

    if (routing) {
      setRouting(false);
    }

    if (suggesting) {
      suggestNearby();
    }

    if (onSetSuggesting) onSetSuggesting(suggesting);
  }, [suggesting]);

  useEffect(() => {
    onSetSuggested(suggestedActivities);
    setFetchingNearby(false);
  }, [suggestedActivities]);

  useEffect(() => {
    if (noLocationsNearby) {
      setFetchingNearby(false);
    }
  }, [noLocationsNearby]);

  useEffect(() => {
    if (fetchingNearby) {
      setSettingsDirty(false);
      setSettingsOpen(false);
    }
  }, [fetchingNearby]);

  useEffect(() => {
    if (!routing) {
      setRoutingData([]);
    } else {
      setSuggesting(false);
      setRoutingData([
        timelineActivities[0],
        timelineActivities[timelineActivities.length - 1],
      ]);
    }
  }, [routing]);

  useEffect(() => {
    if (!directionsService || !directionsRenderer) return;

    if (routingData.length === 0) {
      setRouteDriveTime(null);
      setRouteDriveDistance(null);
      directionsRenderer.setMap(null);
    } else {
      if (routingData.length === 2) {
        const waypoints = timelineActivities
          .filter((activity, index) => {
            const minIndex = Math.min(
              routingData[0].index,
              routingData[1].index
            );
            const maxIndex = Math.max(
              routingData[0].index,
              routingData[1].index
            );
            return index > minIndex && index < maxIndex;
          })
          .map((activity) => ({ location: activity.position }));

        calculateRoute(
          routingData[0].position,
          routingData[1].position,
          waypoints
        );
      }
    }
  }, [routingData]);

  useEffect(() => {
    setSuggesting(false);
    setRouting(false);
  }, [currentDayFilter]);

  function secondsToTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    const hoursDisplay =
      hours > 0 ? `${hours} hour${hours > 1 ? "s" : ""}` : "";
    const minutesDisplay =
      minutes > 0 ? `${minutes} minute${minutes > 1 ? "s" : ""}` : "";

    if (hoursDisplay && minutesDisplay) {
      return `${hoursDisplay} and ${minutesDisplay}`;
    }
    return hoursDisplay || minutesDisplay || "0 minutes";
  }
  function metersToMiles(meters) {
    const miles = meters * 0.000621371;
    return `${miles.toFixed(3)} miles`;
  }

  function calculateRoute(start, end, waypoints) {
    if (!directionsService || !directionsRenderer) return;

    // const mileThreshold = 1; // 1 mile
    const distanceInMeters =
      mapsService.geometry.spherical.computeDistanceBetween(start, end);
    // const distanceInMiles = distanceInMeters * 0.000621371;

    const travelMode = "DRIVING"; // "WALKING", "BICYCLING", "TRANSIT

    const driveRequest = {
      origin: start,
      destination: end,
      travelMode,
      waypoints: waypoints,
    };

    directionsService.route(driveRequest, (result, status) => {
      if (status === "OK") {
        // console.log("Route calculated", result);
        directionsRenderer.setMap(map);
        directionsRenderer.setDirections(result);
        let driveDuration = 0;
        let driveDistance = 0;
        result.routes[0].legs.forEach((leg) => {
          driveDuration += leg.duration.value;
          driveDistance += leg.distance.value;
        });

        const routePath = result.routes[0].overview_path;
        const arrowSymbol = {
          path: mapsService.SymbolPath.FORWARD_CLOSED_ARROW,
          strokeColor: "#ffee00",
          fillColor: "#ffee00",
          fillOpacity: 1,
          scale: 3,
          zIndex: 999,
        };

        const polyline = new mapsService.Polyline({
          path: routePath,
          strokeColor: "#FF0000",
          strokeOpacity: 0.8,
          strokeWeight: 2,
          icons: [
            {
              icon: arrowSymbol,
              offset: "100%",
              repeat: "100px",
            },
          ],
          zIndex: 998,
        });

        polyline.setMap(map);

        setRouteDriveTime(secondsToTime(driveDuration));
        setRouteDriveDistance(metersToMiles(driveDistance));

        const walkRequest = {
          origin: start,
          destination: end,
          travelMode: "WALKING",
          waypoints: waypoints,
        };

        directionsService.route(walkRequest, (result, status) => {
          if (status === "OK") {
            // console.log("Route calculated", result);

            let walkDuration = 0;
            let walkDistance = 0;
            result.routes[0].legs.forEach((leg) => {
              walkDuration += leg.duration.value;

              walkDistance += leg.distance.value;
            });

            setRouteWalkTime(secondsToTime(walkDuration));
            setRouteWalkDistance(metersToMiles(walkDistance));
          }
        });
      }
    });
  }

  const [settingsOpen, setSettingsOpen] = useState(false);

  const [contentHovered, setContentHovered] = useState(false);

  return (
    <>
      <Box
        id="itinerary-menu"
        style={{
          position: "fixed",
          bottom: "50%",
          transform: timelineOpen
            ? "translateX(0) translateY(50%)"
            : "translateX(calc(100% + 20px)) translateY(50%)",
          right: 0,
          zIndex: 99999,
          background: "rgba(255,255,255,.75)",
          borderRadius: "1em 0 0 1em",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          transition: "transform 0.3s ease-in-out",
          maxWidth: "25vw",
          display: "flex",
          flexDirection: "column",
          // overflowY: "auto",
        }}
      >
        <div
          style={{
            maxHeight: "100vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: !timelineOpen ? -55 : 0,
              // padding: "10px",
              // cursor: "pointer",
              borderRadius: "1em",
              border: !timelineOpen ? "1px solid black" : "none",
              backgroundColor: !timelineOpen
                ? "rgba(255,255,255,1)"
                : "rgba(0,0,0,0)",
              display: "flex",
              alignContent: "center",
              alignItems: "center",
              justifyContent: "center",
              justifyItems: "center",
              transition: "all .7s ease",
              padding: "16px",
              paddingLeft: 0,
              marginRight: "16px",
              cursor: timelineOpen ? "auto" : "pointer",
              zIndex: 99999 + 1, // Ensure this is higher than the box's z-index
            }}
            onClick={(e) => {
              e.stopPropagation();
              setTimelineOpen(!timelineOpen);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
            }}
            onPointerEnter={(e) => {
              e.stopPropagation();
            }}
          >
            <IconButton
              size="large"
              // onClick={() => {
              //   setTimelineOpen(!timelineOpen);
              // }}
            >
              {!timelineOpen ? <ArrowBackIos /> : <ArrowForwardIos />}
            </IconButton>
          </div>
          {!suggesting &&
            timelineActivities &&
            timelineActivities.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  display: "flex",
                  justifyContent: "center",
                  justifyItems: "center",
                  alignContent: "center",
                  alignItems: "center",
                  padding: "10px",
                  cursor: "pointer",
                }}
              >
                <IconButton
                  onClick={() => {
                    setRouting(!routing);
                  }}
                >
                  {routing ? <Cancel /> : <ForkLeft />}
                </IconButton>
              </div>
            )}
          {!suggesting &&
            timelineActivities &&
            timelineActivities.length > 0 && (
              <>
                <div style={{ flex: "0 1 auto" }}>
                  <div
                    style={{
                      display: "flex",
                      paddingTop: "16px",
                      paddingLeft: "16px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexFlow: "column",
                        marginTop: "0px",
                        marginBottom: "0px",
                      }}
                    >
                      <small>{englishDate}</small>
                      <h2
                        style={{
                          fontFamily: "'Fredoka', sans-serif",
                          textDecoration: "underline",
                          marginTop: "4px",
                          marginBottom: 0,
                          userSelect: "none",
                          msUserSelect: "none",
                          MozUserSelect: "none",
                          WebkitUserSelect: "none",
                          WebkitTouchCallout: "none",
                          display: "inline-flex",
                        }}
                      >
                        <div
                          style={{
                            zIndex: 99999 + 2, // Ensure this is higher than the box's z-index
                          }}
                        >
                          <IconButton
                            size="small"
                            onClick={() => {
                              let newFilters = markerPropertyFilters.filter(
                                (filter) => {
                                  return (
                                    filter.property !== FILTER_PROPERTIES.day
                                  );
                                }
                              );
                              setMarkerPropertyFilters(newFilters);
                            }}
                          >
                            <Close />
                          </IconButton>
                        </div>
                        Day {currentDayFilter}
                        <div style={{ display: "flex", placeItems: "center" }}>
                          <IconButton
                            sx={{ pt: 0, pb: 0 }}
                            onClick={() => {
                              let prevDay = currentDayFilter - 1;
                              if (
                                prevDay <
                                Math.min(
                                  ...allDays.filter((x) => Number.isInteger(x))
                                )
                              )
                                prevDay = Math.min(
                                  ...allDays.filter((x) => Number.isInteger(x))
                                );
                              let newFilters = markerPropertyFilters.filter(
                                (filter) => {
                                  return (
                                    filter.property !== FILTER_PROPERTIES.day
                                  );
                                }
                              );
                              newFilters.push({
                                type: FILTER_TYPE.INCLUDE,
                                property: FILTER_PROPERTIES.day,
                                value: [prevDay],
                              });

                              setMarkerPropertyFilters(newFilters);
                            }}
                          >
                            <ArrowBack />
                          </IconButton>
                          <IconButton
                            sx={{ pt: 0, pb: 0 }}
                            onClick={() => {
                              let nextDay = currentDayFilter + 1;
                              if (
                                nextDay >
                                Math.max(
                                  ...allDays.filter((x) => Number.isInteger(x))
                                )
                              )
                                nextDay = Math.max(
                                  ...allDays.filter((x) => Number.isInteger(x))
                                );
                              let newFilters = markerPropertyFilters.filter(
                                (filter) => {
                                  return (
                                    filter.property !== FILTER_PROPERTIES.day
                                  );
                                }
                              );
                              newFilters.push({
                                type: FILTER_TYPE.INCLUDE,
                                property: FILTER_PROPERTIES.day,
                                value: [nextDay],
                              });

                              setMarkerPropertyFilters(newFilters);
                            }}
                          >
                            <ArrowForward />
                          </IconButton>
                        </div>
                      </h2>
                    </div>
                  </div>
                </div>
                {routing && (
                  <>
                    <h3
                      style={{
                        fontFamily: "'Fredoka', sans-serif",
                        paddingLeft: "32px",
                        margin: "0px",
                      }}
                    >
                      Routing
                    </h3>
                    {routeDriveTime && routeDriveDistance && (
                      <div
                        style={{
                          paddingLeft: "46px",
                          marginTop: "0px",
                        }}
                      >
                        <p
                          style={{
                            fontFamily: "'Fredoka', sans-serif",
                            margin: "0px",
                          }}
                        >
                          Driving: {routeDriveTime}
                        </p>
                        <p
                          style={{
                            fontFamily: "'Fredoka', sans-serif",
                            paddingLeft: "16px",
                            margin: "0px",
                          }}
                        >
                          {routeDriveDistance}
                        </p>
                      </div>
                    )}

                    {routeWalkTime && routeWalkDistance && (
                      <div
                        style={{
                          paddingLeft: "46px",
                        }}
                      >
                        <p
                          style={{
                            fontFamily: "'Fredoka', sans-serif",
                            margin: "0px",
                          }}
                        >
                          Walking: {routeWalkTime}
                        </p>
                        <p
                          style={{
                            fontFamily: "'Fredoka', sans-serif",
                            paddingLeft: "16px",
                            marginTop: "0px",
                          }}
                        >
                          {routeWalkDistance}
                        </p>
                      </div>
                    )}
                  </>
                )}
                <Box
                  onPointerOver={(e) => {
                    if (!e.target) return;

                    if (isElementOverflowing(e.target)) setContentHovered(true);
                  }}
                  onPointerOut={() => setContentHovered(false)}
                  sx={{
                    pr: contentHovered ? "-.5em" : ".5em", // Reserve space for scrollbar
                    flex: "1 1 auto",
                    overflowY: contentHovered ? "auto" : "hidden",
                    boxSizing: "border-box",
                    "&::-webkit-scrollbar": {
                      width: "0.5em",
                      height: "0.5em",
                      position: "absolute",
                    },
                    "&::-webkit-scrollbar-track": {
                      background: "transparent !important",
                      borderRadius: "20px",
                      position: "absolute",
                    },
                    "&::-webkit-scrollbar-thumb": {
                      backgroundColor: "#708090 !important",
                      borderRadius: "20px",
                      backgroundClip: "content-box",
                      border: "2px solid transparent",
                      position: "absolute",
                    },
                  }}
                >
                  <Timeline
                    driveDuration={routeDriveTime}
                    walkDuration={routeWalkTime}
                    driveDistance={routeDriveDistance}
                    walkDistance={routeWalkDistance}
                    selectedActivities={routingData
                      .slice(0, 2)
                      .map((data) => data.index)}
                    activities={timelineActivities}
                    onActivityClick={(activity) => {
                      if (routing) {
                        let routeData = [...routingData];
                        if (routeData.length >= 2) {
                          routeData = [];
                          setRoutingData([]);
                        }
                        routeData.push({
                          index: activity.index,
                          position: activity.position,
                        });
                        setRoutingData(routeData);
                      } else {
                        onActivityClick(activity.marker);
                      }
                    }}
                    onActivityMouseOver={(activity) =>
                      onActivityMouseOver(activity.marker)
                    }
                    onActivityMouseOut={(activity) =>
                      onActivityMouseOut(activity.marker)
                    }
                  />
                </Box>
              </>
            )}
          <div
            style={{
              flex: "0 1 auto",
              paddingTop:
                timelineActivities && timelineActivities.length > 0
                  ? "10px"
                  : 0,
            }}
          >
            {!suggesting && !routing && (
              <Box
                sx={{
                  width: "100%",
                  display: "flex",
                  placeContent: "end",
                  pl:
                    !timelineActivities || timelineActivities.length === 0
                      ? 4
                      : 0,
                  pb:
                    timelineActivities && timelineActivities.length > 0 ? 1 : 0,
                  pr:
                    timelineActivities && timelineActivities.length > 0 ? 1 : 0,
                }}
              >
                <Button
                  sx={{
                    p:
                      !timelineActivities || timelineActivities.length === 0
                        ? 2
                        : 0,
                  }}
                  onClick={() => {
                    setSuggesting(true);
                  }}
                >
                  Find Suggestions
                </Button>
              </Box>
            )}
          </div>

          {suggesting && (
            <>
              <Box
                sx={{
                  display: "flex",
                  flexFlow: "column",
                  placeItems: "center",
                  pt: 2,
                  flex: "0 1 auto",
                }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    fontFamily: "'Fredoka', sans-serif",
                    display: "inline",
                    userSelect: "none",
                    msUserSelect: "none",
                    MozUserSelect: "none",
                    WebkitUserSelect: "none",
                    WebkitTouchCallout: "none",
                  }}
                >
                  Nearby Activity Suggestions
                  <IconButton
                    size="small"
                    onClick={() => setSuggesting(false)}
                    sx={{
                      position: "absolute",
                      p: 0,
                      ml: 1,
                      ">.MuiSvgIcon-root": {
                        fontSize: "1em",
                      },
                    }}
                  >
                    <Cancel />
                  </IconButton>
                </Typography>
                <Accordion
                  expanded={settingsOpen}
                  onChange={(_, expanded) => setSettingsOpen(expanded)}
                  sx={{
                    background: "none",
                    boxShadow: "none",
                    "& .MuiAccordionSummary-content": {
                      justifyContent: "center",
                    },
                    "& .MuiAccordionDetails-root": {
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      pt: 0,
                      pb: 0,
                      mb: 1,
                    },
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography
                      variant="body1"
                      sx={{ fontFamily: "'Fredoka', sans-serif", ml: "24px" }}
                    >
                      Settings
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <InputSlider
                      value={suggestRadius}
                      label="Search Radius (meters)"
                      min={100}
                      max={10000}
                      onValueChanged={(value) => setSuggestRadius(value)}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={!googleAccount ? false : usingGooglePOIs}
                          onChange={(_, checked) => {
                            if (!googleAccount) {
                              setLoginPopupOpen(true);

                              return;
                            }
                            setUsingGooglePOIs(checked);
                          }}
                        />
                      }
                      labelPlacement="start"
                      label={
                        <Typography
                          variant="body1"
                          sx={{ fontFamily: "'Fredoka', sans-serif", mb: 0 }}
                        >
                          Search Google Places
                        </Typography>
                      }
                    />
                    {usingGooglePOIs && (
                      <>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={filterNonLatin}
                              onChange={(_, checked) =>
                                setFilterNonLatin(checked)
                              }
                            />
                          }
                          labelPlacement="start"
                          label={
                            <Typography
                              variant="body1"
                              sx={{
                                fontFamily: "'Fredoka', sans-serif",
                                mb: 0,
                              }}
                            >
                              Filter Non-English Locations
                            </Typography>
                          }
                        />
                        <Typography
                          variant="body1"
                          sx={{ fontFamily: "'Fredoka', sans-serif", mb: 1 }}
                        >
                          Suggested Types
                        </Typography>
                        <Grid
                          container
                          spacing={1}
                          sx={{ placeContent: "center", placeItems: "center" }}
                        >
                          {suggestLocationDefaultTypes.map((type, i) => (
                            <Grid item key={"suggested-type-" + i}>
                              <Chip
                                variant="filled"
                                sx={{
                                  backgroundColor: "white",
                                  opacity: suggestedTypes.includes(type)
                                    ? 1
                                    : 0.65,
                                  border: "1px solid gray",
                                }}
                                key={"suggested-type-filter-chip-" + i}
                                label={type.replace("_", " ")}
                                onDelete={() => {
                                  if (suggestedTypes.includes(type))
                                    setSuggestedTypes(
                                      suggestedTypes.filter((t) => t !== type)
                                    );
                                  else
                                    setSuggestedTypes([
                                      ...suggestedTypes,
                                      type,
                                    ]);
                                }}
                                deleteIcon={
                                  suggestedTypes.includes(type) ? (
                                    <Delete />
                                  ) : (
                                    <Add
                                      sx={{
                                        opacity: "1 !important",
                                        color: "black",
                                      }}
                                    />
                                  )
                                }
                              />
                            </Grid>
                          ))}
                          {/* {suggestedTypes.length !==
                  suggestLocationDefaultTypes.length && (
                  <Grid item>
                    <ChipSelectMenu
                      multiple={false}
                      label={"Add Type"}
                      icon={<Add />}
                      options={suggestLocationDefaultTypes.filter(
                        (type) => !suggestedTypes.includes(type)
                      )}
                      onChange={(selected) => {
                        setSuggestedTypes([...suggestedTypes, selected]);
                      }}
                    />
                  </Grid>
                )} */}
                        </Grid>
                      </>
                    )}
                    {settingsDirty && (
                      <Button
                        variant="contained"
                        sx={{ mt: 2, pb: 0 }}
                        onClick={() => {
                          suggestNearby();
                        }}
                      >
                        Refresh
                      </Button>
                    )}
                  </AccordionDetails>
                </Accordion>
              </Box>

              <Box
                onPointerOver={(e) => {
                  if (!e.target) return;

                  if (isElementOverflowing(e.target)) setContentHovered(true);
                }}
                onPointerOut={() => setContentHovered(false)}
                sx={{
                  display: "flex",
                  flexFlow: "column",
                  // placeContent: "center",
                  placeItems: "center",
                  pl: 1,
                  pr: contentHovered ? "-.5em" : ".5em", // Reserve space for scrollbar
                  flex: "1 1 auto",
                  boxSizing: "border-box",
                  overflowY: contentHovered ? "auto" : "hidden",
                  "&::-webkit-scrollbar": {
                    width: "0.5em",
                    height: "0.5em",
                    position: "absolute",
                  },
                  "&::-webkit-scrollbar-track": {
                    background: "transparent !important",
                    borderRadius: "20px",
                    position: "absolute",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    backgroundColor: "#708090 !important",
                    borderRadius: "20px",
                    backgroundClip: "content-box",
                    border: "2px solid transparent",
                    position: "absolute",
                  },
                }}
              >
                {suggestedActivities.length > 0 && !fetchingNearby && (
                  <List
                    sx={{
                      pt: 0,
                      // maxHeight: "200px",
                      // overflowY: "auto",
                      width: "100%",
                      userSelect: "none",
                      msUserSelect: "none",
                      MozUserSelect: "none",
                      WebkitUserSelect: "none",
                      WebkitTouchCallout: "none",
                    }}
                  >
                    {suggestedActivities.map((marker, i) => (
                      <ListItem
                        key={"suggestion-" + i + "-" + marker.info}
                        sx={{
                          textAlign: "center",
                          placeItems: "center",
                          placeContent: "center",
                          cursor: "pointer",
                          userSelect: "none",
                          msUserSelect: "none",
                          MozUserSelect: "none",
                          WebkitUserSelect: "none",
                          WebkitTouchCallout: "none",
                        }}
                        onClick={() => {
                          onActivityClick(marker);
                        }}
                        onPointerOver={() => {
                          onActivityMouseOver(marker);
                        }}
                        onPointerOut={() => {
                          onActivityMouseOut(marker);
                        }}
                      >
                        <Box sx={{ display: "flex", gap: 1 }}>
                          {!marker.isPlacesPOI && <Star />}
                          <Typography
                            variant="body1"
                            sx={{
                              textAlign: "center",
                              fontFamily: "'Fredoka', sans-serif",
                            }}
                          >
                            {marker.info}
                          </Typography>
                          <Add />
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                )}
                {(suggestedActivities.length === 0 || fetchingNearby) &&
                  !noLocationsNearby && <CircularProgress sx={{ m: 2 }} />}
                {suggestedActivities.length === 0 && noLocationsNearby && (
                  <Box sx={{ p: 1 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontFamily: "'Fredoka', sans-serif",
                        textAlign: "center",
                      }}
                    >
                      No nearby activities found.
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        textAlign: "center",
                        fontFamily: "'Fredoka', sans-serif",
                      }}
                    >
                      Adjust your settings and try again or try another
                      location.
                    </Typography>
                  </Box>
                )}
              </Box>
            </>
          )}
        </div>
      </Box>
    </>
  );
}
