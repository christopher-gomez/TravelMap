import { useEffect, useRef, useState } from "react";
import { CustomInfoWindowFactory } from "../POI/CustomOverlayContainerClass";
import { ChipPopperMenu } from "../../Util/MultipleSelect";
import { Alert, Box, Snackbar, Typography } from "@mui/material";
import {
  Cancel,
  Directions,
  DirectionsCar,
  DirectionsWalk,
} from "@mui/icons-material";
import { useRouteDataStore } from "./RouteDataStore";

export default function ItineraryRouting({
  timelineActivities,
  directionsRenderer,
  directionsService,
  mapsService,
  map,
  currentDayFilter,
  routing,
  setRouting,
  travelMode,
  setTravelMode,
  focusedMarker,
  focusedCluster,
  disableMarkerFocusing,
  setDisableMarkerFocusing,
  markers,
}) {
  //   const [routingData, setRoutingData] = useState([]);

  const { state: routingData, setData: setRoutingData } = useRouteDataStore();

  useEffect(() => {
    if (!routing) {
      setRoutingData([]);
      //   setRouteDriveTime(null);
      //   setRouteDriveDistance(null);
    } else {
      if (!directionsService) {
        setRouting(false);
        return;
      }

      if (focusedMarker) {
        findRoute();
      } else if (timelineActivities && timelineActivities.length > 1) {
        //   setSuggesting(false);
        setRoutingData([
          timelineActivities[0],
          timelineActivities[timelineActivities.length - 1],
        ]);
      }

      //   findRoute();
    }
  }, [routing]);

  const findRoute = () => {
    if (!routingData.data) return;

    setNoRouteFound(false);

    if (routingData.data.length < 2) {
      //   setRouteDriveTime(null);
      //   setRouteDriveDistance(null);
      polylineRef.current.forEach((poly) => poly.setMap(null));
      polylineRef.current = [];
      infoWindowsRef.current.forEach((infoWindow) => {
        // infoWindow.close();
        infoWindow.setMap(null);
      });
      infoWindowsRef.current = [];
    } else {
      if (focusedMarker || !timelineActivities) {
        calculateRoute(
          routingData.data[0].position,
          routingData.data[1].position
        );
      } else if (timelineActivities && timelineActivities.length > 1) {
        const waypoints = timelineActivities
          .filter((activity, index) => {
            const minIndex = Math.min(
              routingData.data[0].index,
              routingData.data[1].index
            );
            const maxIndex = Math.max(
              routingData.data[0].index,
              routingData.data[1].index
            );
            return index > minIndex && index < maxIndex;
          })
          .map((activity) => ({ location: activity.position }));

        calculateRoute(
          routingData.data[0].position,
          routingData.data[1].position,
          waypoints
        );
      }
    }
  };

  useEffect(() => {
    // if (!directionsService || !directionsRenderer) return;
    if (routingData.data.length >= 2 && !routing) setRouting(true);
    else findRoute();
  }, [routingData.data]);

  useEffect(() => {
    // setSuggesting(false);
    setRouting(false);
    setRoutingData([]);
    // setRouteDriveTime(null);
    // setRouteDriveDistance(null);
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
    waypoints?.forEach((waypoint) => {
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
          <div style="padding: 5px>
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
        onClose: (infoWindow) => {
          infoWindow.setMap(null);
          polyline.setMap(null);

          const index = polylineRef.current.indexOf(polyline);
          polylineRef.current.splice(index, 1);
          infoWindowsRef.current.splice(index, 1);

          if (polylineRef.current.length === 0) {
            setRouting(false);
          }
        },
        onHover: (hovered) => {
          polylineRef.current.forEach((poly, index) => {
            if (hovered && poly !== polyline) {
              poly.setVisible(false);
              if (infoWindowsRef.current[index]) {
                infoWindowsRef.current[index].setMap(null);
              }
            } else if (!hovered && poly !== polyline) {
              polylineRef.current.forEach((poly, index) => {
                poly.setVisible(true);
                if (infoWindowsRef.current[index]) {
                  infoWindowsRef.current[index].setMap(map);
                }
              });
            }
          });
        },
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

    if (polylineRef.current.length === 0) {
      setNoRouteFound(true);
    }
  }

  const [noRouteFound, setNoRouteFound] = useState(false);

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

  const [menuOpen, setMenuOpen] = useState(false);

  const [targetMarkers, setTargetMarkers] = useState([]);

  useEffect(() => {
    console.log("targetMarkers", targetMarkers);
    if (targetMarkers.length === 2) {
      setRoutingData(targetMarkers);
      setMenuOpen(false);
    }
  }, [targetMarkers]);

  const handleMarkerClick = (marker) => {
    if (focusedMarker === marker) return;

    if (focusedMarker) {
      setTargetMarkers([focusedMarker, marker]);
    } else {
      if (targetMarkers.includes(marker)) {
        return;
      }

      setTargetMarkers((prev) => {
        if (prev.includes(marker)) {
          return prev;
        }
        return [...prev, marker];
      });
    }
  };

  const markerListenerRef = useRef([]);

  useEffect(() => {
    if (menuOpen) {
      markerListenerRef.current.forEach((listener) => {
        mapsService.event.removeListener(listener);
      });
      markerListenerRef.current = [];
      setDisableMarkerFocusing(true);

      markers.forEach((marker, i) => {
        markerListenerRef.current.push(
          mapsService.event.addListener(marker, "click", () =>
            handleMarkerClick(marker)
          )
        );
      });
    } else {
      markerListenerRef.current.forEach((listener) => {
        mapsService.event.removeListener(listener);
      });
      setDisableMarkerFocusing(false);
      setTargetMarkers([]);
    }
  }, [menuOpen]);

  return (
    <>
      <ChipPopperMenu
        disableClickAway={true}
        icon={
          routing ? (
            <Cancel sx={{ ">*": { color: "white" } }} />
          ) : (
            <Directions sx={{ ">*": { color: "white" } }} />
          )
        }
        label={"Directions"}
        color={"#4285F4"}
        chipSx={{ color: "white" }}
        onClick={() => {
          if (
            // focusedMarker &&
            !routingData.data ||
            routingData.data.length < 2
          ) {
            setMenuOpen(true);
            return;
          }
          setRouting(!routing);
        }}
        open={menuOpen}
        deleteIcon={
          routing ? (
            <Box
              sx={{
                display: "flex",
                flexFlow: "row",
                placeContent: "center",
                placeItems: "center",
                pl: 0,
              }}
            >
              <DirectionsWalk
                sx={{
                  fontSize: "1em",
                  color:
                    routing && travelMode === "WALKING"
                      ? "white"
                      : "rgba(0,0,0,.35)",
                }}
                onClick={() => {
                  if (routing) {
                    setTravelMode("WALKING");
                  }
                }}
              />
              <DirectionsCar
                sx={{
                  color:
                    routing && travelMode === "DRIVING"
                      ? "white"
                      : "rgba(0,0,0,.35)",
                }}
                onClick={() => {
                  if (routing) {
                    setTravelMode("DRIVING");
                  }
                }}
              />
            </Box>
          ) : undefined
        }
        canOpen={disableMarkerFocusing}
      >
        {disableMarkerFocusing ? (
          <Box>
            <Typography
              sx={{
                fontFamily: "'Fredoka', sans-serif",
              }}
            >
              {!focusedMarker && targetMarkers.length === 0
                ? "Select a starting marker."
                : "Select another marker."}
            </Typography>
            {(focusedMarker || targetMarkers.length > 0) && (
              <Typography
                sx={{
                  fontFamily: "'Fredoka', sans-serif",
                }}
              >
                From:{" "}
                <i>
                  {focusedMarker ? focusedMarker.info : targetMarkers[0].info}
                </i>
              </Typography>
            )}
            {targetMarkers.length === 2 && (
              <Typography
                sx={{
                  fontFamily: "'Fredoka', sans-serif",
                  fontStyle: "italic",
                }}
              >
                To: <i>{targetMarkers[1].info}</i>
              </Typography>
            )}
          </Box>
        ) : null}
      </ChipPopperMenu>
      <Snackbar
        open={noRouteFound}
        autoHideDuration={5000}
        onClose={() => {
          setNoRouteFound(false);
        }}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => {
            setNoRouteFound(false);
          }}
          severity="warning"
          // variant="filled"
          sx={{ width: "100%" }}
        >
          No routes found. Change your travel mode or try again later.
        </Alert>
      </Snackbar>
    </>
  );
}
