import {
  ArrowBack,
  ArrowBackIos,
  ArrowForward,
  ArrowForwardIos,
  Cancel,
  Close,
  DirectionsCar,
  DirectionsWalk,
  ForkLeft,
} from "@mui/icons-material";
import { Box, IconButton } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { FILTER_PROPERTIES, FILTER_TYPE } from "../Header/FilterDialog";
import { isElementOverflowing } from "../../Util/Utils";
import ActivityTimeline from "../../Util/Timeline";
import { CustomInfoWindowFactory } from "../POI/CustomOverlayContainerClass";
import { useRouteDataStore } from "./RouteDataStore";
import { isMobile } from "mobile-device-detect";

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

export default function ItineraryTimeline({
  timelineActivities,
  currentDayFilter,
  allDays,
  markerPropertyFilters,
  setMarkerPropertyFilters,
  onActivityClick,
  onActivityMouseOver,
  onActivityMouseOut,
  open,
  onSetOpen,
  englishDate,
  routing,
  setRouting,
  travelMode,
  setTravelMode,
}) {
  const [timelineOpen, setTimelineOpen] = useState(true);

  const { state: routingData, setState: setRoutingData } = useRouteDataStore();

  useEffect(() => {
    if (open !== undefined) setTimelineOpen(open);
    if (open !== undefined && onSetOpen !== undefined) onSetOpen(open);
  }, [open]);

  useEffect(() => {
    if (onSetOpen !== undefined) {
      onSetOpen(timelineOpen);
    }
  }, [timelineOpen]);

  const [contentHovered, setContentHovered] = useState(false);

  return (
    <>
      <Box
        id="itinerary-menu"
        style={{
          position: "fixed",
          bottom: isMobile ? 0 : "50%",
          top: isMobile ? 0 : 'unset',
          transform: timelineOpen
            ? isMobile
              ? "unset"
              : "translateX(0) translateY(50%)"
            : isMobile
            ? "translateX(calc(100% + 20px)) translateY(25%)"
            : "translateX(calc(100% + 20px)) translateY(50%)",
          right: 0,
          zIndex: 99999,
          background: "rgba(255,255,255,.75)",
          borderRadius: "1em 0 0 1em",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          transition: "transform 0.3s ease-in-out",
          maxWidth: isMobile ? "100vw" : "25vw",
          minWidth: isMobile ? "100vw" : "unset",
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
            minHeight: isMobile ? (timelineOpen ? "100%" : "50%") : "unset",
            maxHeight: isMobile ? (timelineOpen ? "100%" : "50%") : "unset",
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
          {timelineActivities && timelineActivities.length > 0 && (
            <Box sx={{ display: "flex", flexFlow: "column", zIndex: "999999" }}>
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
                  // driveDuration={routeDriveTime}
                  // walkDuration={routeWalkTime}
                  // driveDistance={routeDriveDistance}
                  // walkDistance={routeWalkDistance}
                  selectedActivities={routingData.data
                    .slice(0, 2)
                    .map((data) => data.index)}
                  activities={timelineActivities}
                  onActivityClick={(activity) => {
                    if (routing) {
                      let routeData = [...routingData.data];
                      if (routingData.data.length >= 2) {
                        routeData = [];
                        setRoutingData([]);
                      }
                      routingData.data.push({
                        index: activity.index,
                        position: activity.position,
                      });
                      setRoutingData(routingData.data);
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
          )}
        </div>
      </Box>
    </>
  );
}
