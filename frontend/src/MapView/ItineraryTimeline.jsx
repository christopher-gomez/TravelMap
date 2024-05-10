import {
  Add,
  ArrowBack,
  ArrowBackIos,
  ArrowForward,
  ArrowForwardIos,
  Cancel,
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
  Chip,
  CircularProgress,
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

  function suggestNearby() {
    let nearbyMarkers = findNearbyMarkers(
      timelineActivities,
      allMarkers,
      mapsService,
      suggestRadius
    );

    nearbyMarkers = nearbyMarkers.filter((m) => !m.date);

    findPlacesOfInterest(
      timelineActivities,
      allMarkers,
      placesService,
      async (nearby) => {
        console.log("got all nearby POIs: ", nearby);
        const markers = await createMarkersFromPOIs(
          nearby,
          mapsService,
          geocoderService,
          createOverlay,
          onActivityMouseOver,
          onActivityMouseOut,
          onActivityClick
        );
        setSuggestedActivities([...nearbyMarkers, ...markers]);
      },
      suggestRadius,
      suggestedTypes
    );

    // setSuggestedActivities(nearbyMarkers);
  }

  useEffect(() => {
    if (suggesting) {
      suggestNearby();
    }
  }, [suggestRadius, suggestedTypes]);

  useEffect(() => {
    if (!suggesting) {
      setSuggestedActivities([]);
      setSuggestRadius(1000);
    }

    if (routing) {
      setRouting(false);
    }

    if (suggesting) {
      suggestNearby();
    }
  }, [suggesting]);

  useEffect(() => {
    onSetSuggested(suggestedActivities);
  }, [suggestedActivities]);

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

  return (
    <>
      <Box
        sx={{
          "&::-webkit-scrollbar": {
            width: "0.75em",
            height: "0.85em",
          },
          "&::-webkit-scrollbar-track": {
            background: "#f0f0f0 !important",
            borderRadius: "10px",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#c1c1c1 !important",
            borderRadius: "10px",
            backgroundClip: "content-box",
            border: "2px solid transparent",
          },
        }}
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
          maxHeight: "100vh",
          maxWidth: "25vw",
          // overflowY: "auto",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: !timelineOpen ? -55 : 0,
            padding: "10px",
            cursor: "pointer",
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
            // zIndex: 99999 + 1, // Ensure this is higher than the box's z-index
          }}
          onClick={() => {
            setTimelineOpen(!timelineOpen);
          }}
        >
          <IconButton
          // onClick={() => {
          //   setTimelineOpen(!timelineOpen);
          // }}
          >
            {!timelineOpen ? <ArrowBackIos /> : <ArrowForwardIos />}
          </IconButton>
        </div>
        {!suggesting && (
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
        <div style={{ display: "flex" }}>
          <h2
            style={{
              fontFamily: "'Indie Flower', cursive",
              paddingTop: "16px",
              paddingLeft: "16px",
              marginTop: "32px",
              marginBottom: "0px",
              textDecoration: "underline",
              userSelect: "none",
              msUserSelect: "none",
              MozUserSelect: "none",
              WebkitUserSelect: "none",
              WebkitTouchCallout: "none",
            }}
          >
            Day {currentDayFilter}
          </h2>

          <div style={{ display: "flex", placeItems: "end" }}>
            <IconButton
              onClick={() => {
                let prevDay = currentDayFilter - 1;
                if (
                  prevDay <
                  Math.min(...allDays.filter((x) => Number.isInteger(x)))
                )
                  prevDay = Math.min(
                    ...allDays.filter((x) => Number.isInteger(x))
                  );
                let newFilters = markerPropertyFilters.filter((filter) => {
                  return filter.property !== FILTER_PROPERTIES.day;
                });
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
              onClick={() => {
                let nextDay = currentDayFilter + 1;
                if (
                  nextDay >
                  Math.max(...allDays.filter((x) => Number.isInteger(x)))
                )
                  nextDay = Math.max(
                    ...allDays.filter((x) => Number.isInteger(x))
                  );
                let newFilters = markerPropertyFilters.filter((filter) => {
                  return filter.property !== FILTER_PROPERTIES.day;
                });
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
        </div>
        {routing && (
          <>
            <h3
              style={{
                fontFamily: "'Indie Flower', cursive",
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
                    fontFamily: "'Indie Flower', cursive",
                    margin: "0px",
                  }}
                >
                  Driving: {routeDriveTime}
                </p>
                <p
                  style={{
                    fontFamily: "'Indie Flower', cursive",
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
                    fontFamily: "'Indie Flower', cursive",
                    margin: "0px",
                  }}
                >
                  Walking: {routeWalkTime}
                </p>
                <p
                  style={{
                    fontFamily: "'Indie Flower', cursive",
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
        <Timeline
          driveDuration={routeDriveTime}
          walkDuration={routeWalkTime}
          driveDistance={routeDriveDistance}
          walkDistance={routeWalkDistance}
          selectedActivities={routingData.slice(0, 2).map((data) => data.index)}
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
          onActivityMouseOut={(activity) => onActivityMouseOut(activity.marker)}
        />
        {!suggesting && !routing && (
          <Box sx={{ width: "100%", display: "flex", placeContent: "end" }}>
            <Button
              onClick={() => {
                setSuggesting(true);
              }}
            >
              Find Suggestions
            </Button>
          </Box>
        )}
        {suggesting && (
          <Box
            sx={{ display: "flex", flexFlow: "column", placeItems: "center" }}
          >
            <Typography
              variant="h5"
              sx={{
                fontFamily: "'Indie Flower', cursive",
                display: "inline",
                userSelect: "none",
                msUserSelect: "none",
                MozUserSelect: "none",
                WebkitUserSelect: "none",
                WebkitTouchCallout: "none",
              }}
            >
              Activity Suggestions
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
            <Box
              sx={{
                display: "flex",
                flexFlow: "column",
                placeContent: "center",
                placeItems: "center",
                pl: 1,
                pr: 1,
              }}
            >
              <Accordion
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
                    pt: 0
                  }
                }}
              >
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography
                    variant="body1"
                    sx={{ fontFamily: "'Indie Flower', cursive", ml: "24px" }}
                  >
                    Suggestion Settings
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <InputSlider
                    value={suggestRadius}
                    label="Radius"
                    min={100}
                    max={5000}
                    onValueChanged={(value) => setSuggestRadius(value)}
                  />
                  <Typography
                    variant="body1"
                    sx={{ fontFamily: "'Indie Flower', cursive", mb: 1 }}
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
                            opacity: suggestedTypes.includes(type) ? 1 : 0.65,
                            border: "1px solid gray",
                          }}
                          key={"suggested-type-filter-chip-" + i}
                          label={type.replace("_", " ")}
                          onDelete={() => {
                            if (suggestedTypes.includes(type))
                              setSuggestedTypes(
                                suggestedTypes.filter((t) => t !== type)
                              );
                            else setSuggestedTypes([...suggestedTypes, type]);
                          }}
                          deleteIcon={
                            suggestedTypes.includes(type) ? (
                              <Delete />
                            ) : (
                              <Add
                                sx={{ opacity: "1 !important", color: "black" }}
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
                </AccordionDetails>
              </Accordion>
            </Box>
            {suggestedActivities.length > 0 && (
              <List
                sx={{
                  pt: 0,
                  maxHeight: "200px",
                  overflowY: "auto",
                  width: "100%",
                  "&::-webkit-scrollbar": {
                    width: "0.75em",
                    height: "0.85em",
                  },
                  "&::-webkit-scrollbar-track": {
                    background: "#f0f0f0 !important",
                    borderRadius: "10px",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    backgroundColor: "#c1c1c1 !important",
                    borderRadius: "10px",
                    backgroundClip: "content-box",
                    border: "2px solid transparent",
                  },
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
                          fontFamily: "'Indie Flower', cursive",
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
            {suggestedActivities.length === 0 && (
              <CircularProgress sx={{ m: 2 }} />
            )}
          </Box>
        )}
      </Box>
    </>
  );
}
