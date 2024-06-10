import {
  Add,
  ArrowBack,
  ArrowBackIos,
  ArrowForward,
  ArrowForwardIos,
  Cancel,
  Close,
  Delete,
  DirectionsCar,
  DirectionsWalk,
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
import { useEffect, useRef, useState } from "react";
import { FILTER_PROPERTIES, FILTER_TYPE } from "./Header/FilterDialog";
import Timeline, { HorizontalActivityTimeline } from "../Util/Timeline";
import {
  createMarkersFromPOIs,
  findNearbyMarkers,
  findPlacesOfInterest,
  isElementOverflowing,
} from "../Util/Utils";
import InputSlider from "../Util/InputSlider";
import { ChipSelectMenu } from "../Util/MultipleSelect";
import ActivityTimeline from "../Util/Timeline";
import { CustomInfoWindowFactory } from "./POI/CustomOverlayContainerClass";
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
    if (open !== undefined && onSetOpen !== undefined) onSetOpen(open);
  }, [open]);

  useEffect(() => {
    if (onSetOpen !== undefined) {
      onSetOpen(timelineOpen);
    }
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
      setRouteDriveTime(null);
      setRouteDriveDistance(null);
    } else {
      if (!directionsService) {
        setRouting(false);
        return;
      }

      setSuggesting(false);
      setRoutingData([
        timelineActivities[0],
        timelineActivities[timelineActivities.length - 1],
      ]);
    }
  }, [routing]);

  const findRoute = () => {
    if (routingData.length === 0) {
      setRouteDriveTime(null);
      setRouteDriveDistance(null);
      polylineRef.current.forEach((poly) => poly.setMap(null));
      polylineRef.current = [];
      infoWindowsRef.current.forEach((infoWindow) => {
        // infoWindow.close();
        infoWindow.setMap(null);
      });
      infoWindowsRef.current = [];
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
  };

  useEffect(() => {
    // if (!directionsService || !directionsRenderer) return;
    findRoute();
  }, [routingData]);

  useEffect(() => {
    setSuggesting(false);
    setRouting(false);
    setRoutingData([]);
    setRouteDriveTime(null);
    setRouteDriveDistance(null);
    polylineRef.current.forEach((poly) => poly.setMap(null));
    polylineRef.current = [];
    infoWindowsRef.current.forEach((infoWindow) => {
      // infoWindow.close();
      infoWindow.setMap(null);
    });
    infoWindowsRef.current = [];
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
    return `${miles.toFixed(2)} miles`;
  }

  const polylineRef = useRef([]);
  const infoWindowsRef = useRef([]);
  const infoWindowFactory = useRef(null);

  useEffect(() => {
    if (!mapsService) return;
    infoWindowFactory.current = new CustomInfoWindowFactory(mapsService);
  }, [mapsService]);

  const [travelMode, setTravelMode] = useState("DRIVING");

  useEffect(() => {
    if (routing) {
      findRoute();
    }
  }, [travelMode]);

  async function calculateSegmentRoute(start, end, travelMode) {
    return new Promise((resolve, reject) => {
      directionsService.route(
        {
          origin: start,
          destination: end,
          travelMode,
        },
        (result, status) => {
          if (status === "OK") {
            resolve(result);
          } else {
            reject(status);
          }
        }
      );
    });
  }

  function calculateAvoidanceOffset(existingInfoWindows, position) {
    const offset = { x: 10, y: 0 };
    const offsetIncrement = 10; // Pixels to move the InfoWindow if it overlaps

    existingInfoWindows.forEach((infoWindow) => {
      const infoWindowPosition = infoWindow.getPosition();
      const distance = mapsService.geometry.spherical.computeDistanceBetween(
        position,
        infoWindowPosition
      );

      if (distance < offsetIncrement / 2) {
        offset.y += offsetIncrement * 5; // Adjust the y-offset to avoid overlap
        offset.x += offsetIncrement * 2; // Adjust the x-offset to avoid overlap
      }
    });

    return offset;
  }

  const routeCache = useRef({}); // Cache dictionary to store route results

  async function calculateRoute(start, end, waypoints) {
    if (!directionsService || !directionsRenderer) return;

    // const travelMode = "DRIVING"; // or "WALKING", "BICYCLING", etc.

    // Split waypoints into individual segments
    const segments = [];
    let previousPoint = start;
    waypoints.forEach((waypoint) => {
      segments.push({ start: previousPoint, end: waypoint.location });
      previousPoint = waypoint.location;
    });
    segments.push({ start: previousPoint, end: end });

    // Clear existing polylines and InfoWindows
    polylineRef.current.forEach((poly) => poly.setMap(null));
    polylineRef.current = [];
    infoWindowsRef.current.forEach((infoWindow) => {
      infoWindow.setMap(null);
    });
    infoWindowsRef.current = [];

    // Calculate routes for each segment
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const cacheKey = `${travelMode} ${segment.start.lat()}_${segment.start.lng()}_${segment.end.lat()}_${segment.end.lng()}`;

      let result;
      if (routeCache.current[cacheKey]) {
        result = routeCache.current[cacheKey];
      } else {
        try {
          result = await calculateSegmentRoute(
            segment.start,
            segment.end,
            travelMode
          );
          routeCache.current[cacheKey] = result;
        } catch (error) {
          console.error(`Error calculating segment ${i}:`, error);
          continue; // Skip this segment and continue with the next one
        }
      }

      const routePath = result.routes[0].overview_path;

      // Create polyline for the segment
      const polyline = new mapsService.Polyline({
        path: routePath,
        strokeColor: generateColor(i, segments.length),
        strokeOpacity: 1,
        strokeWeight: 5,
        icons: [
          {
            icon: {
              path: mapsService.SymbolPath.FORWARD_CLOSED_ARROW,
              strokeColor: "#000000",
              strokeWeight: 1,
              fillColor: "#ffee00",
              fillOpacity: 1,
              scale: 3.5,
              zIndex: 999,
            },
            offset: "100%",
            repeat: "100px",
          },
        ],
        zIndex: 998,
      });

      polyline.setMap(map);
      polylineRef.current.push(polyline);

      // Calculate midpoint for InfoBox
      const midpointIndex = Math.floor(routePath.length / 2);
      const midpoint = routePath[midpointIndex];

      const infoWindowContent = `
        <div style="background-color: white; padding: 5px; border-radius: 5px;">
          <h3 style="margin: 0;">${
            travelMode === "DRIVING" ? "🚗" : "🚶"
          } ${secondsToTime(result.routes[0].legs[0].duration.value)}</h3>
          <p style="margin: 0;">${metersToMiles(
            result.routes[0].legs[0].distance.value
          )}</p>
        </div>
      `;

      const offset = { x: 0, y: 0 };

      const myOptions = {
        content: infoWindowContent,
        disableAutoPan: false,
        maxWidth: 0,
        boxStyle: {
          boxShadow: "0 0 10px rgba(0, 0, 0, 0.5)",
          width: "auto",
        },
        stemStyle: {},
        closeBoxMargin: "10px 2px 2px 2px",
        closeBoxURL: "http://www.google.com/intl/en_us/mapfiles/close.gif",
        isHidden: false,
        pane: "overlayLayer",
        enableEventPropagation: false,
        position: midpoint,
        pixelOffset: new mapsService.Size(offset.x, offset.y),
      };

      const infoWindow = infoWindowFactory.current.create(myOptions);

      infoWindow.setMap(map);
      infoWindowsRef.current.push(infoWindow);

      // Add hover events to polyline
      mapsService.event.addListener(polyline, "mouseover", () => {
        polylineRef.current.forEach((poly, index) => {
          if (poly !== polyline) {
            poly.setVisible(false);
            if (infoWindowsRef.current[index]) {
              infoWindowsRef.current[index].setMap(null);
            }
          }
        });
      });

      mapsService.event.addListener(polyline, "mouseout", () => {
        polylineRef.current.forEach((poly, index) => {
          if (poly !== polyline) {
            poly.setVisible(true);
            if (infoWindowsRef.current[index]) {
              infoWindowsRef.current[index].setMap(map);
            }
          }
        });
      });
    }
  }

  function generateColor(index, total) {
    const hue = (index / total) * 360;
    return `hsl(${hue}, 100%, 50%)`;
  }

  useEffect(() => {
    return () => {
      polylineRef.current.forEach((poly) => poly.setMap(null));
      polylineRef.current = [];
      infoWindowsRef.current.forEach((infoWindow) => {
        // infoWindow.close();
        infoWindow.setMap(null);
      });
      infoWindowsRef.current = [];
    };
  }, []);

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
          flexDirection: "row",
          // overflowY: "auto",
        }}
      >
        <div
          style={{
            position: !timelineOpen ? "absolute" : "relative",
            top: 0,
            bottom: 0,
            left: !timelineOpen ? -55 : 0,
            // padding: "10px",
            // cursor: "pointer",
            borderRadius: "1em 0 0 1em",
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
            padding: 0,
            marginRight: !timelineOpen ? "16px" : 0,
            cursor: "pointer",
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
          <IconButton size="large" sx={{ pr: timelineOpen ? 0 : "unset" }}>
            {!timelineOpen ? <ArrowBackIos /> : <ArrowForwardIos />}
          </IconButton>
        </div>
        <div
          style={{
            maxHeight: "100vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {
            // !suggesting &&
            timelineActivities && timelineActivities.length > 0 && (
              <Box
                sx={{ display: "flex", flexFlow: "column", zIndex: "999999" }}
              >
                <div
                  style={{
                    flex: "0 1 auto",
                    display: "flex",
                    width: "100%",
                    flexFlow: "column",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      paddingTop: "16px",
                      paddingLeft: "16px",
                      justifyContent: "space-between",
                      width: "100%",
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
                    <div
                      style={{
                        // position: "absolute",
                        // top: 0,
                        // right: 0,
                        display: "flex",
                        justifyContent: "center",
                        justifyItems: "center",
                        alignContent: "center",
                        alignItems: "center",
                        // padding: "10px",
                        cursor: "pointer",
                        placeSelf: "flex-start",
                        marginTop: "-16px",
                      }}
                    >
                      {routing && (
                        <>
                          <IconButton
                            color={
                              travelMode === "DRIVING" ? "primary" : "default"
                            }
                            onClick={() => {
                              setTravelMode("DRIVING");
                            }}
                          >
                            <DirectionsCar />
                          </IconButton>
                          <IconButton
                            color={
                              travelMode === "WALKING" ? "primary" : "default"
                            }
                            onClick={() => {
                              setTravelMode("WALKING");
                            }}
                          >
                            <DirectionsWalk />
                          </IconButton>
                        </>
                      )}
                      <IconButton
                        onClick={() => {
                          setRouting(!routing);
                        }}
                      >
                        {routing ? <Cancel /> : <ForkLeft />}
                      </IconButton>
                    </div>
                  </div>
                  {/* {routing && (
                <div>
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
                </div>
              )} */}
                </div>
                <Box
                  onPointerOver={(e) => {
                    if (!e.target) return;

                    if (isElementOverflowing(e.target)) setContentHovered(true);
                  }}
                  onPointerOut={() => setContentHovered(false)}
                  sx={{
                    // pr: contentHovered ? "-.5em" : ".5em", // Reserve space for scrollbar
                    flex: "1 1 auto",
                    overflowX: contentHovered ? "auto" : "hidden",
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
                  <ActivityTimeline
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
              </Box>
            )
          }

          {
          // (!timelineActivities || !timelineActivities.length === 0) &&
           (
            <Box
              sx={{
                display: "flex",
                flexFlow: "column",
                placeItems: "center",
                p: 2,
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
                  textAlign: "center",
                }}
              >
                Nearby Activity Suggestions
                {/* <IconButton
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
                </IconButton> */}
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
                                  setSuggestedTypes([...suggestedTypes, type]);
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
                </AccordionDetails>
              </Accordion>
              {/* {settingsDirty && ( */}
              <Button
                variant="contained"
                sx={{ mt: 2, pb: 0 }}
                onClick={() => {
                  if (suggesting) suggestNearby();
                  else setSuggesting(true);
                }}
              >
                Search
              </Button>
              {/* )} */}
            </Box>
          )}

          {suggesting && (
            <>
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
                {/* {suggestedActivities.length > 0 && !fetchingNearby && (
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
                )} */}
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
