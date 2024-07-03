import React, { useEffect, useRef, useState } from "react";
import GoogleMapReact from "google-map-react";
import dayjs from "dayjs";
// import testData from "./MapTestData.json";
import TransitStyle from "./MapStyles/TransitStyle.json";
import DefaultStyle from "./MapStyles/DefaultStyle.json";
import DarkStyle from "./MapStyles/DarkStyle.json";
import {
  ClusterStats,
  MarkerClusterer,
  MarkerClustererEvents,
  MarkerUtils,
  SuperClusterAlgorithm,
} from "@googlemaps/markerclusterer";

import { queryDatabase } from "../Api/Notion";
import { NOTION_QUERY } from "./NotionMapQueryParams";
import { getGoogleMapsApiKey } from "../Api/Maps";
import CustomOverlayContainerFactory, {
  CustomDistrictOverlayFactory,
  CustomVignetteOverlayFactory,
} from "./POI/CustomOverlayContainerClass";
import POILabel from "./POI/POILabel";
import ICON_KEYS from "./POI/IconMapKeys";
import AppHeader from "./Header/MapHeader";
import { FILTER_PROPERTIES, FILTER_TYPE } from "./Header/FilterDialog";
import AppFooter from "./Footer/AppFooter";
import {
  updateActivityTime,
  updateActivityDate,
  updateActivityTags,
  updateActivityTitle,
  updateActivityEmojiIcon,
  updateActivityGooglePlacePhotos,
  updateActivityGooglePlaceID,
  deleteActivity,
} from "./UpdateLocationProperties";
import GoogleSignIn from "../Util/GoogleSignIn";
import ItineraryTimeline, {
  timeOrder,
  timeOverrideKeys,
} from "./MiscComponents/ItineraryTimeline";
import {
  Logger,
  createCompositeIcon,
  createEmojiIcon,
  lerp,
  // getUniqueCitiesFromMarkers,
} from "../Util/Utils";
import { Typography } from "@mui/material";
import MapDrawer from "./Footer/MapDrawer";
import { useStackNavigation } from "../Util/StackNavigation";
import { useRouteDataStore } from "./MiscComponents/RouteDataStore";

// import {
//   findLocationLngLat,
//   updateLocationProperties,
// } from "./UpdateLocationProperties";
// import fetchNotionPage from "../util/api";

// import PlacesData from "./data.json";

const OVERLAYS_ALWAYS_VISIBLE_ZOOM_LEVEL = 100;

const MapView = () => {
  const defaultProps = {
    center: {
      lat: 35.681217193603516,
      lng: 139.76666259765625,
    },
    zoom: 13,
  };

  const [fetchedAPIKey, setFetchedAPIKey] = useState(null);
  const [fetchingKey, setFetchingKey] = useState(false);

  const [itineraryData, setItineraryData] = useState(null);
  const [fetchingData, setFetchingData] = useState(false);

  useEffect(() => {
    const fetchAPIKey = async () => {
      if (fetchingKey) return;

      setFetchingKey(true);

      const key = await getGoogleMapsApiKey();

      setFetchedAPIKey(key);
      setFetchingKey(false);
    };

    const fetchItineraryData = async (startCursor) => {
      if (fetchingData) return;

      setFetchingData(true);

      let results = [];
      let hasMore = true;
      let cursor = startCursor;

      while (hasMore) {
        const data = await queryDatabase({
          ...NOTION_QUERY,
          cursor: cursor,
        });

        results = results.concat(data.results);
        hasMore = data.has_more;
        cursor = data.next_cursor; // Update cursor to the next cursor from response
      }

      setItineraryData(results);
      setFetchingData(false);
    };

    if (!fetchedAPIKey) fetchAPIKey();

    if (!itineraryData) fetchItineraryData(null);
  }, []);

  const createOptions = (maps) => {
    const hour = new Date().getHours();
    let target = hour >= 6 && hour < 18 ? DefaultStyle : DarkStyle;
    const styles = JSON.parse(JSON.stringify(target));
    return {
      fullscreenControl: false,
      // mapId: "1491931a2040a345",
      styles: styles,
      gestureHandling: "greedy",
      disableDefaultUI: true,
      mapTypeControl: false,
    };
  };

  const [map, setMap] = useState(undefined);
  const mapRef = React.useRef(map);
  const [maps, setMaps] = useState(undefined);
  const mapsRef = React.useRef(maps);

  const [noLocationItems, setNoLocationItems] = useState([]);

  function parseItineraryDataLocations(data) {
    const places = [];
    const unknownPlaces = [];
    // Logger.Log("data", data);
    data.forEach((item) => {
      if (
        item.properties.Location.rich_text.length === 0 ||
        item.properties.Location.rich_text[0].plain_text === ""
      ) {
        unknownPlaces.push(item);
        return;
      }

      tripDateRange.current = item.properties.DateRange.formula.date;

      try {
        const locations = JSON.parse(
          item.properties.Location.rich_text[0].plain_text
        );
        locations.forEach((location) => {
          places.push({
            title: item.properties.Activity.title[0].plain_text,
            position: { lat: location[0], lng: location[1] },
            icon:
              item.properties.mapIconKey.rich_text.length > 0
                ? item.properties.mapIconKey.rich_text[0].plain_text
                : item.icon && item.icon.type === "emoji"
                ? { type: "emoji", value: item.icon.emoji }
                : item.icon && item.icon.type === "external"
                ? item.icon.external.url
                : null,
            priority: item.properties.mapIconPriority.number ?? 0,
            description:
              item.properties.Description.rich_text.length > 0
                ? item.properties.Description.rich_text[0].plain_text
                : "",
            tags:
              item.properties.Tags.multi_select.length > 0
                ? item.properties.Tags.multi_select.map((tag) => tag.name)
                : null,
            date: item.properties.Date.date
              ? {
                  start: item.properties.Date.date.start,
                  end: item.properties.Date.date.end,
                }
              : null,
            time: item.properties.Time.select
              ? item.properties.Time.select.name
              : null,
            id: item.id,
            timelineOverride:
              item.properties.mapTimelineOverride.rich_text.length > 0
                ? JSON.parse(
                    // JSON.stringify(
                    item.properties.mapTimelineOverride.rich_text[0].plain_text
                    // )
                  )
                : null,
            placesSearchName:
              item.properties.mapIDName.rich_text.length > 0
                ? item.properties.mapIDName.rich_text[0].plain_text
                : null,
            city:
              item.properties.City.multi_select.length > 0
                ? item.properties.City.multi_select.map((city) => city.name)
                : null,
            related:
              item.properties["Related Agendas"].relation.length > 0
                ? item.properties["Related Agendas"].relation.map(
                    (agenda) => agenda.id
                  )
                : null,
            link: item.properties.Link.url ? item.properties.Link.url : null,
            placeId:
              item.properties.googlePlaceID.rich_text.length > 0
                ? item.properties.googlePlaceID.rich_text[0].plain_text
                : null,
            photo:
              // item.properties.googlePlacePhotoURL.rich_text.length > 0
              //   ? JSON.parse(
              //       // JSON.stringify(
              //       item.properties.googlePlacePhotoURL.rich_text[0].plain_text
              //       // )
              //     )
              //   :
              null,
          });
        });
      } catch (error) {
        const location = item.properties.Location.rich_text[0].plain_text
          .split(",")
          .map((item) => parseFloat(item.trim()));
        places.push({
          title: item.properties.Activity.title[0].plain_text,
          position: { lat: location[0], lng: location[1] },
          icon:
            item.properties.mapIconKey.rich_text.length > 0
              ? item.properties.mapIconKey.rich_text[0].plain_text
              : item.icon && item.icon.type === "emoji"
              ? { type: "emoji", value: item.icon.emoji }
              : item.icon && item.icon.type === "external"
              ? item.icon.external.url
              : null,
          priority: item.properties.mapIconPriority.number ?? 0,
          description:
            item.properties.Description.rich_text.length > 0
              ? item.properties.Description.rich_text[0].plain_text
              : "",
          tags:
            item.properties.Tags.multi_select.length > 0
              ? item.properties.Tags.multi_select.map((tag) => tag.name)
              : null,
          date: item.properties.Date.date
            ? {
                start: item.properties.Date.date.start,
                end: item.properties.Date.date.end,
              }
            : null,
          time: item.properties.Time.select
            ? item.properties.Time.select.name
            : null,
          id: item.id,
          timelineOverride:
            item.properties.mapTimelineOverride.rich_text.length > 0
              ? JSON.parse(
                  // JSON.stringify(
                  item.properties.mapTimelineOverride.rich_text[0].plain_text
                  // )
                )
              : null,
          placesSearchName:
            item.properties.mapIDName.rich_text.length > 0
              ? item.properties.mapIDName.rich_text[0].plain_text
              : null,
          city:
            item.properties.City.multi_select.length > 0
              ? item.properties.City.multi_select.map((city) => city.name)
              : null,
          related:
            item.properties["Related Agendas"].relation.length > 0
              ? item.properties["Related Agendas"].relation.map(
                  (agenda) => agenda.id
                )
              : null,
          link: item.properties.Link.url ? item.properties.Link.url : null,
          placeId:
            item.properties.googlePlaceID.rich_text.length > 0
              ? item.properties.googlePlaceID.rich_text[0].plain_text
              : null,
          photo:
            // item.properties.googlePlacePhotoURL.rich_text.length > 0
            //   ? JSON.parse(
            //       // JSON.stringify(
            //       item.properties.googlePlacePhotoURL.rich_text[0].plain_text
            //       // )
            //     )
            //   :
            null,
        });
      }
    });

    setNoLocationItems(unknownPlaces);
    return places;
  }

  function getMarkerOverlayKey(marker, isCluster = false) {
    let cluster = marker;
    if (isCluster) {
      marker = cluster.marker;
    }

    const _position =
      typeof marker.position.lat === "function" &&
      typeof marker.position.lng === "function"
        ? { lat: marker.position.lat(), lng: marker.position.lng() }
        : marker.position;

    return (
      _position.lat +
      "," +
      _position.lng +
      (isCluster ? "-" + cluster.markers.length + "_cluster" : "")
    );
  }

  const createInitialMarkers = (data, map, maps) => {
    const markers = [];
    let index = 0;
    for (const item of data) {
      const marker = createMarker({
        maps,
        map,
        id: item.id,
        placeId: item.placeId,
        photo: item.photo,
        title: item.title,
        position: item.position,
        icon:
          typeof item.icon !== "object" &&
          !Array.isArray(item.icon) &&
          item.icon !== null &&
          item.icon in ICON_KEYS
            ? {
                url: ICON_KEYS[item.icon].url,
                size: new maps.Size(
                  ICON_KEYS[item.icon].scaledSize[0],
                  ICON_KEYS[item.icon].scaledSize[1]
                ),
                scaledSize: new maps.Size(
                  ICON_KEYS[item.icon].scaledSize[0],
                  ICON_KEYS[item.icon].scaledSize[1]
                ),
                // origin: new mapsRef.current.Point(0, 0), // origin
                // anchor: new mapsRef.current.Point(
                //   ICON_KEYS[item.icon].scaledSize[0] / 2,
                //   ICON_KEYS[item.icon].scaledSize[1] / 2
                // ), // anchor
              }
            : null,
        priority: item.priority,
        altPlaceName: item.placesSearchName,
      });

      if (item.icon && item.icon.type === "emoji") {
        createEmojiIcon(item.icon.value, (img) => {
          marker.setIcon({
            url: img,
            scaledSize: new mapsRef.current.Size(100, 100), // size of the icon
            origin: new mapsRef.current.Point(0, 0), // origin
            anchor: new mapsRef.current.Point(50, 50), // anchor
          });
        });
      }

      if (item.icon) {
        if (item.icon in ICON_KEYS) {
          marker["iconKey"] = item.icon;
          marker["iconType"] = "custom";
        } else if (item.icon.type === "emoji") marker["iconType"] = "emoji";
      } else {
        marker["iconType"] = "default";
      }

      marker["info"] = item.title;
      marker["description"] = item.description;
      marker["tags"] = item.tags;
      marker["date"] = item.date;
      marker["day"] = calculateDay(item.date);
      marker["time"] = item.time;
      marker["id"] = item.id;
      marker["timelineOverride"] = item.timelineOverride;
      marker["placesSearchName"] = item.placesSearchName;
      if (marker.tags && marker.tags.includes("Accommodation")) {
        marker.timelineOverride = { ...marker.timelineOverride, misc: [1, 4] };
      }
      marker["city"] = item.city;
      marker["related"] = item.related;
      marker["link"] = item.link;
      marker["overlayOffsetY"] = 20;

      markers.push(marker);

      const overlay = createOverlay({
        marker: item,
        type: "title",
        offsetY:
          item.icon !== null && item.icon in ICON_KEYS
            ? ICON_KEYS[item.icon].offsetY
            : marker.overlayOffsetY
            ? marker.overlayOffsetY
            : 0,
      });

      marker["overlay"] = overlay;
      index++;
    }

    setMarkers(markers);
  };

  const CustomOverlayFactory = useRef(null);

  const userLocationMarker = useRef(null);
  const curUserLocation = useRef(null);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition((position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        curUserLocation.current = pos;

        if (userLocationMarker.current) {
          userLocationMarker.current.setPosition(pos);
        } else {
          userLocationMarker.current = new maps.Marker({
            position: pos,
            map: map,
            icon: {
              url: ICON_KEYS["currentLocation"].url,
              size: new maps.Size(
                ICON_KEYS["currentLocation"].scaledSize[0],
                ICON_KEYS["currentLocation"].scaledSize[1]
              ),
            },
          });

          userLocationMarker.current.setMap(map);
        }
      });
    }
  };

  useEffect(() => {
    if (itineraryData !== null && map !== undefined && maps !== undefined) {
      CustomOverlayFactory.current = new CustomOverlayContainerFactory(maps);
      const places = parseItineraryDataLocations(itineraryData);
      createInitialMarkers(places, map, maps);
    }

    if (
      map !== undefined &&
      maps !== undefined &&
      !userLocationMarker.current
    ) {
      getUserLocation();
    }
  }, [itineraryData, map, maps]);

  const canAdjustMapCenter = useRef(false);

  function calculateRealCenter() {
    if (!mapRef.current) return null;

    const boundsAndCenter = calculateMapCenterAndBounds();

    if (!boundsAndCenter) return mapRef.current.getCenter();

    let { center } = boundsAndCenter;

    // if (!shouldKeepFocusCenteredRef.current)
    //   center = mapRef.current.getCenter();

    const rightMenu = document.getElementById("itinerary-menu");
    const headerMenu = document.getElementById("header-menu");
    const leftDrawer = document.getElementById("left-drawer");
    const swipeDrawer = document.getElementById("swipe-drawer-header");

    // Get the computed style of the right menu
    let rightMenuWidth = 0;
    let headerMenuHeight = 0;
    let leftDrawerWidth = 0;
    let swipeDrawerHeight = 0;

    if (rightMenu) {
      const boundingRect = rightMenu.getBoundingClientRect();
      // Logger.Log("rightMenu boundingRect:", boundingRect);
      // Logger.Log("rightMenu boundingRect.right:", boundingRect.right);
      // Logger.Log("rightMenu boundingRect.left:", boundingRect.left);
      // Logger.Log("window.innerWidth:", window.innerWidth);
      // Logger.Log(
      //   "boundingRect.right > 0 && boundingRect.left < window.innerWidth:",
      //   boundingRect.right > 0 && boundingRect.left < window.innerWidth
      // );
      // Check if the right menu is within the viewport
      // if (boundingRect.right > 0 && boundingRect.left < window.innerWidth) {
      if (timelineVisibleRef.current) {
        rightMenuWidth = rightMenu.clientWidth * 10;
      } else {
        rightMenuWidth = 20;
      }
    }

    if (headerMenu) {
      const boundingRect = headerMenu.getBoundingClientRect();
      headerMenuHeight = boundingRect.height;
    }

    if (leftDrawer) {
      // leftDrawerWidth = leftDrawer.clientWidth;
    }

    if (swipeDrawer) {
      swipeDrawerHeight = swipeDrawer.clientHeight * 100;
    }

    // Calculate the pixel offset
    const scale = Math.pow(2, mapRef.current.getZoom());
    const worldCoordinateCenter = mapRef.current
      .getProjection()
      .fromLatLngToPoint(center);
    const pixelOffsetW =
      Math.abs(rightMenuWidth - leftDrawerWidth) / (256 * scale);
    const pixelOffsetH = swipeDrawerHeight / (256 * scale);

    let newCenterX = worldCoordinateCenter.x + pixelOffsetW;
    let newCenterY = worldCoordinateCenter.y + pixelOffsetH;

    // Calculate the new center
    const newCenter = mapRef.current
      .getProjection()
      .fromPointToLatLng(new mapsRef.current.Point(newCenterX, newCenterY));

    Logger.BeginLog(
      "calculateRealCenter()",
      "\n",
      "Center:",
      center,
      "\n",
      "New Center:",
      newCenter,
      "\n",
      "Pixel Offset W:",
      pixelOffsetW,
      "Pixel Offset H:",
      pixelOffsetH,
      "\n",
      "rightMenuWidth:",
      rightMenuWidth,
      "headerMenuHeight:",
      headerMenuHeight,
      "leftDrawerWidth:",
      leftDrawerWidth
    );
    Logger.Trace();
    Logger.EndLog();

    // addDebuggingLine(center, newCenter); // Debugging line
    // Debugging information
    // Logger.Log("World Coordinate Center:", worldCoordinateCenter);
    // Logger.Log("Pixel Offset:", pixelOffset);
    // Logger.Log("New Center X:", newCenterX, "New Center Y:", newCenterY);
    // Logger.Log("Calculated New Center:", newCenter);
    // Logger.Log("Bounds Center:", center);

    return newCenter;
  }

  const debuggingLine = useRef(null);
  const originalCenterCircle = useRef(null);
  const newCenterCircle = useRef(null);

  useEffect(() => {
    return () => {
      if (debuggingLine.current) {
        debuggingLine.current.setMap(null);
      }

      if (originalCenterCircle.current) {
        originalCenterCircle.current.setMap(null);
      }

      if (newCenterCircle.current) {
        newCenterCircle.current.setMap(null);
      }
    };
  }, []);

  function addDebuggingLine(originalCenter, newCenter) {
    if (!mapRef.current || !mapsRef.current) return;

    // Remove the previous line if it exists
    if (debuggingLine.current) {
      debuggingLine.current.setMap(null);
    }

    if (originalCenterCircle.current) {
      originalCenterCircle.current.setMap(null);
    }

    if (newCenterCircle.current) {
      newCenterCircle.current.setMap(null);
    }

    // Create a new line
    debuggingLine.current = new mapsRef.current.Polyline({
      path: [originalCenter, newCenter],
      geodesic: true,
      strokeColor: "#FF0000",
      strokeOpacity: 1.0,
      strokeWeight: 2,
    });

    // Set the line on the map
    debuggingLine.current.setMap(mapRef.current);

    // Create a white circle at the original center
    originalCenterCircle.current = new mapsRef.current.Circle({
      strokeColor: "#FFFFFF",
      strokeOpacity: 1.0,
      strokeWeight: 2,
      fillColor: "#FFFFFF",
      fillOpacity: 1.0,
      map: mapRef.current,
      center: originalCenter,
      radius: 2, // Radius in meters
    });

    // Create a green circle at the new center
    newCenterCircle.current = new mapsRef.current.Circle({
      strokeColor: "#00FF00",
      strokeOpacity: 1.0,
      strokeWeight: 2,
      fillColor: "#00FF00",
      fillOpacity: 1.0,
      map: mapRef.current,
      center: newCenter,
      radius: 2, // Radius in meters
    });
  }

  // function adjustMapCenter(force = false) {
  //   if (
  //     (!canAdjustMapCenter.current && !force) ||
  //     (!shouldKeepFocusCenteredRef.current && !force)
  //   )
  //     return;

  //   const center = calculateRealCenter();
  //   if (!center) return;

  //   Logger.BeginLog("adjustMapCenter()");
  //   Logger.Trace();
  //   Logger.EndLog();

  //   mapRef.current.panTo(center);
  // }

  const hasAddedBoundsIdle = useRef(false);
  const hasAddedZoomIdle = useRef(false);

  useEffect(() => {
    mapsRef.current = maps;

    mapRef.current = map;

    if (map && maps) {
      map.addListener("bounds_changed", () => {
        // Logger.BeginLog("bounds_changed");
        // Logger.Trace();
        // Logger.EndLog();

        if (!hasAddedBoundsIdle.current) {
          hasAddedBoundsIdle.current = true;

          mapsRef.current.event.addListenerOnce(mapRef.current, "idle", () => {
            // Logger.Log("bounds_changed -> idle");
            // updateVignette();

            if (!shouldKeepFocusCenteredRef.current) {
              hasAddedBoundsIdle.current = false;
              return;
            }

            const realCenter = calculateRealCenter();

            if (!realCenter) {
              hasAddedBoundsIdle.current = false;
              return;
            }

            const bounds = mapRef.current.getBounds();
            let shouldAdjustCenter = false;

            // Check if focused marker is out of bounds
            if (focusedMarkerRef.current) {
              const focusedMarkerPosition = focusedMarkerRef.current.position;
              if (
                (!suggestedMarkersRef.current ||
                  suggestedMarkersRef.current.length === 0) &&
                (!bounds.contains(focusedMarkerPosition) ||
                  !mapRef.current.getCenter().equals(realCenter))
              ) {
                shouldAdjustCenter = true;
              }
            }

            // Check if any markers within the focused cluster are out of bounds
            if (focusedClusterRef.current) {
              for (let marker of focusedClusterRef.current.markers) {
                if (
                  !bounds.contains(marker.position) ||
                  !mapRef.current.getCenter().equals(realCenter)
                ) {
                  shouldAdjustCenter = true;
                  break;
                }
              }
            }

            // Check if any suggested markers are out of bounds
            // if (
            //   suggestedMarkersRef.current &&
            //   suggestedMarkersRef.current.length > 0
            // ) {
            //   for (let marker of suggestedMarkersRef.current) {
            //     if (
            //       !bounds.contains(marker.position) ||
            //       !mapRef.current.getCenter().equals(realCenter)
            //     ) {
            //       shouldAdjustCenter = true;
            //       break;
            //     }
            //   }
            // }

            if (
              isFilteringSingleDay.current &&
              suggestedMarkersRef.current.length === 0 &&
              !focusedMarkerRef.current &&
              !focusedClusterRef.current
            ) {
              for (let marker of renderedMarkersRef.current) {
                if (
                  !bounds.contains(marker.position) ||
                  !mapRef.current.getCenter().equals(realCenter)
                ) {
                  shouldAdjustCenter = true;
                  break;
                }
              }
            }
            if (shouldAdjustCenter) {
              if (
                focusedClusterRef.current ||
                // (suggestedMarkersRef.current &&
                //   suggestedMarkersRef.current.length > 0)
                //   ||
                (isFilteringSingleDay.current &&
                  suggestedMarkersRef.current.length === 0 &&
                  !focusedMarkerRef.current &&
                  !focusedClusterRef.current)
              ) {
                const markerBounds = new mapsRef.current.LatLngBounds();
                focusedClusterRef.current?.markers.forEach((m) =>
                  markerBounds.extend(m.position)
                );
                // suggestedMarkersRef.current?.forEach((m) =>
                //   markerBounds.extend(m.position)
                // );

                if (
                  isFilteringSingleDay.current &&
                  suggestedMarkersRef.current.length === 0 &&
                  !focusedMarkerRef.current &&
                  !focusedClusterRef.current
                ) {
                  renderedMarkersRef.current
                    .filter((m) => m.day)
                    .forEach((m) => markerBounds.extend(m.position));
                }

                if (
                  (focusedClusterRef.current &&
                    focusedClusterRef.current.markers.some(
                      (m) => !bounds.contains(m.position)
                    )) ||
                  // (suggestedMarkersRef.current &&
                  //   suggestedMarkersRef.current.some(
                  //     (m) => !bounds.contains(m.position)
                  //   )) ||
                  (isFilteringSingleDay.current &&
                    !focusedMarkerRef.current &&
                    !focusedClusterRef.current &&
                    suggestedMarkersRef.current.length === 0 &&
                    renderedMarkersRef.current
                      .filter((m) => m.day)
                      .some((m) => !bounds.contains(m.position)))
                )
                  mapRef.current.fitBounds(markerBounds);

                // adjustMapCenter();
                centerMap();
              } else {
                // adjustMapCenter();
                centerMap();
              }
            }

            hasAddedBoundsIdle.current = false;
          });
        }
      });

      map.addListener("zoom_changed", () => {
        if (!hasAddedZoomIdle.current) {
          hasAddedZoomIdle.current = true;
          mapsRef.current.event.addListenerOnce(mapRef.current, "idle", () => {
            Logger.BeginLog("zoom_changed -> idle");
            // Logger.Trace();

            if (!markerClusterersRef.current) {
              hasAddedZoomIdle.current = false;
              return;
            }

            const zoomLevel = mapRef.current.getZoom();
            const maxZoom = mapRef.current.mapTypes.get(
              mapRef.current.getMapTypeId()
            ).maxZoom;
            const minZoom = 3;
            // mapRef.current.mapTypes.get(
            //   mapRef.current.getMapTypeId()
            // ).minZoom;
            // Normalize the zoom level to a range between 0 and 1
            let t = (zoomLevel - minZoom) / (maxZoom - minZoom);
            const factor = 1 / 1;
            t = Math.pow(t, factor);

            Logger.BeginLog(
              "Setting new icon sizes",
              "\n",
              "Zoom Level:",
              zoomLevel,
              "\n",
              "Max Zoom:",
              maxZoom,
              "\n",
              "Min Zoom:",
              minZoom,
              "\n",
              "T:",
              t
            );

            const setNewIconSize = (marker) => {
              // if (!marker || !marker.map || !marker.visible) return;

              Logger.BeginLog("Setting new icon size for marker", marker.info);

              let minSize, maxSize;

              if (marker.iconType === "emoji") {
                minSize = new mapsRef.current.Size(50, 50);
                maxSize = new mapsRef.current.Size(100, 100);
              } else if (marker.iconType === "custom") {
                minSize = new mapsRef.current.Size(
                  ICON_KEYS[marker.iconKey].scaledSize[0] / 2,
                  ICON_KEYS[marker.iconKey].scaledSize[1] / 2
                );
                maxSize = new mapsRef.current.Size(
                  ICON_KEYS[marker.iconKey].scaledSize[0],
                  ICON_KEYS[marker.iconKey].scaledSize[1]
                );
              } else {
                minSize = new mapsRef.current.Size(20 / 2, 34 / 2);
                maxSize = new mapsRef.current.Size(20, 34); // Default size (width, height)
              }

              // Calculate the interpolated size
              const width = lerp(minSize.width, maxSize.width, t);
              const height = lerp(minSize.height, maxSize.height, t);

              const newSize = new mapsRef.current.Size(width, height);
              const newAnchor =
                marker.iconType === "emoji"
                  ? new mapsRef.current.Point(width / 2, height / 2)
                  : marker.iconType === "default"
                  ? new mapsRef.current.Point(width / 2, height)
                  : new mapsRef.current.Point(width / 2, height / 2);

              Logger.Log(
                "marker.iconType:",
                marker.iconType,
                "\n",
                "marker.iconKey:",
                marker.iconKey,
                "\n",
                "minSize:",
                minSize,
                "\n",
                "maxSize:",
                maxSize,
                "\n",
                "newSize:",
                newSize,
                "\n",
                "newAnchor:",
                newAnchor
              );

              // Set the new icon size
              let icon = marker.icon;
              if (icon)
                marker.setIcon({
                  ...icon,
                  size: newSize,
                  scaledSize: newSize,
                  anchor: newAnchor,
                });
              else
                marker.setIcon({
                  size: newSize,
                  scaledSize: newSize,
                  anchor: newAnchor,
                });

              Logger.Log("new icon size set", marker.icon);
              Logger.EndLog();
            };

            markerClusterersRef.current.forEach((mc) =>
              mc.clusters.forEach((c) => {
                setNewIconSize(c.marker);

                if (c.markers.length > 1) {
                  c.markers.forEach((m) => {
                    setNewIconSize(m);
                  });
                }
              })
            );

            Logger.EndLog();

            Logger.EndLog();

            hasAddedZoomIdle.current = false;
          });
        }
      });
    }

    const adjustWindow = () => {
      centerMap();
    };

    window.removeEventListener("resize", adjustWindow);
    window.addEventListener("resize", adjustWindow);

    return () => {
      window.removeEventListener("resize", adjustWindow);

      if (maps && map) {
        maps.event.clearListeners(map, "bounds_changed");
        maps.event.clearListeners(map, "idle");
        maps.event.clearListeners(map, "zoom_changed");
      }
    };
  }, [map, maps]);

  const [markers, setMarkers] = useState([]);
  const markersRef = React.useRef(markers);
  const [markerClusterers, setMarkerClusterers] = useState(undefined);
  const markerClusterersRef = React.useRef(markerClusterers);

  useEffect(() => {
    markerClusterersRef.current = markerClusterers;
  }, [markerClusterers]);

  const calculateDay = (activityDate) => {
    if (!activityDate) return null;

    const tripStart = dayjs(tripDateRange.current.start);
    const activityStart = dayjs(activityDate.start);
    const activityEnd = activityDate.end
      ? dayjs(activityDate.end)
      : activityStart;

    // Calculate the start and end day numbers
    const startDay =
      Math.ceil((activityStart - tripStart) / (1000 * 60 * 60 * 24)) + 1;
    const endDay =
      Math.floor((activityEnd - tripStart) / (1000 * 60 * 60 * 24)) + 1;

    // Generate an array of day numbers if there are multiple days
    if (activityDate.end) {
      const dayNumbers = [];
      for (let i = startDay; i <= endDay; i++) {
        dayNumbers.push(i - 1);
      }
      return dayNumbers;
    }

    // If the activity is only one day, return an array with that single number
    return startDay - 1;
  };

  const calculateDateFromDay = (day) => {
    if (day == null || !tripDateRange.current.start) return null;

    const tripStart = dayjs(tripDateRange.current.start);
    const date = tripStart.add(day, "day");

    return date.format("dddd, MMM D"); // Adjust the date format as needed
  };

  const calculateDayFromDate = (date) => {
    if (!tripDateRange.current.start) return null;

    const tripStart = dayjs(tripDateRange.current.start);
    const tripEnd = dayjs(tripDateRange.current.end);
    const currentDate = dayjs(date ? date : tripDateRange.current.start);

    // If the current date is before the trip start date
    if (currentDate.isBefore(tripStart)) {
      return null;
    }

    // If the current date is after the trip end date
    if (tripEnd && currentDate.isAfter(tripEnd)) {
      return null;
    }

    // Calculate the day number
    const currentDay =
      Math.floor((currentDate - tripStart) / (1000 * 60 * 60 * 24)) + 1;

    return currentDay;
  };

  const tripDateRange = useRef(null);

  const [markerDays, setMarkerDays] = useState([]);

  useEffect(() => {
    if (!markers) return;

    markersRef.current.forEach((m) => {
      m.setVisible(false);
      m.setMap(null);
      m["overlay"].setMap(null);

      m = null;
    });

    markersRef.current = markers;

    renderMarkers();
    renderOverlays();
  }, [markers]);

  const [currentDayFilter, setCurrentDayFilter] = useState("All");
  const currentDayFilterRef = React.useRef(currentDayFilter);
  const [allTags, setAllTags] = useState([]);
  const [allTimes, setAllTimes] = useState([]);
  const [allCities, setAllCities] = useState([]);
  const [suggestedMarkers, setSuggestedMarkers] = useState([]);
  const [renderedSuggestedMarkers, setRenderedSuggestedMarkers] = useState([]);
  const [suggestingFor, setSuggestingFor] = useState(null);
  const suggestedMarkersRef = React.useRef(suggestedMarkers);

  function setClusterersMarkers(markers) {
    markerClusterersRef.current.forEach((mc) => mc.clearMarkers());

    const groupedCityMarkers = groupMarkersByCity(markers);
    groupedCityMarkers.forEach((cityMarkers, i) => {
      markerClusterersRef.current[i].addMarkers(cityMarkers);
    });
  }

  useEffect(() => {
    if (suggestedMarkers === suggestedMarkersRef.current) return;

    suggestedMarkersRef.current = suggestedMarkers;

    if (suggestedMarkers.length > 0) {
      setRenderedSuggestedMarkers(suggestedMarkers);
      if (focusedMarker) setSuggestingFor(focusedMarker);
      else if (focusedCluster) setSuggestingFor(focusedCluster);
      else if (timelineActivities.length > 0) {
        setSuggestingFor({ day: currentDayFilter });
      }

      const markers = [...suggestedMarkers];
      if (focusedMarker) markers.push(focusedMarker);
      else if (focusedCluster) markers.push(...focusedCluster.markers);
      else if (timelineActivities.length > 0) {
        markers.push(...timelineActivities.map((a) => a.marker));
      }

      markers.forEach((m) => {
        if (!m.map) {
          m.setMap(map);
          m.setVisible(true);
          // m.overlay?.setMap(map);
        }
      });

      setClusterersMarkers(markers);

      onClusterClick({
        marker: focusedMarker ? focusedMarker : null,
        markers: markers,
      });
      // setFocusedCluster({
      //   marker: focusedMarker ? focusedMarker : null,
      //   markers: [...suggestedMarkers, focusedMarker],
      // });

      setSuggestedMarkers([]);
      // return;
    }

    // if (suggestedMarkers.length > 0 || shouldReRender) {
    //   renderMarkers();
    //   renderOverlays();
    // }
  }, [suggestedMarkers]);

  const [markerPropertyFilters, setMarkerPropertyFilters] = useState([]);
  const markerPropertyFiltersRef = React.useRef(markerPropertyFilters);

  const isFilteringSingleDay = React.useRef(false);

  const [markerInfoFilter, setMarkerInfoFilter] = useState(null);
  const markerInfoFilterRef = React.useRef(markerInfoFilter);

  useEffect(() => {
    markerInfoFilterRef.current = markerInfoFilter;
  }, [markerInfoFilter]);

  useEffect(() => {
    return () => {
      setMarkerPropertyFilters([]);
    };
  }, []);

  useEffect(() => {
    if (markerPropertyFilters === markerPropertyFiltersRef.current) return;

    markerPropertyFiltersRef.current = markerPropertyFilters;

    isFilteringSingleDay.current =
      markerPropertyFiltersRef.current.filter(
        (p) =>
          p.property === FILTER_PROPERTIES.day &&
          p.value.length === 1 &&
          p.value[0] !== "All"
      ).length > 0;

    let newDayFilter;
    if (
      markerPropertyFilters.length === 0 ||
      markerPropertyFilters.filter((f) => f.property === FILTER_PROPERTIES.day)
        .length === 0 ||
      markerPropertyFilters
        .filter((f) => f.property === FILTER_PROPERTIES.day)
        .find((f) => f.value.includes("All"))
    ) {
      newDayFilter = "All";
    } else if (
      markerPropertyFilters.filter(
        (f) =>
          f.property === FILTER_PROPERTIES.day && //f.type === FILTER_TYPE.MATCH ||
          f.type === FILTER_TYPE.INCLUDE
      ).length === 1 &&
      markerPropertyFilters.filter(
        (f) =>
          f.property === FILTER_PROPERTIES.day && //f.type === FILTER_TYPE.MATCH ||
          f.type === FILTER_TYPE.INCLUDE
      )[0].value.length === 1
    ) {
      newDayFilter = markerPropertyFilters.filter(
        (f) =>
          f.property === FILTER_PROPERTIES.day && //f.type === FILTER_TYPE.MATCH ||
          f.type === FILTER_TYPE.INCLUDE
      )[0].value[0];
    } else {
      newDayFilter = null;
    }

    setFocusedCluster(null);
    setFocusedMarker(null);

    if (newDayFilter === currentDayFilter) {
      renderMarkers();
      renderOverlays();
    } else {
      setCurrentDayFilter(newDayFilter);
    }
  }, [markerPropertyFilters]);

  useEffect(() => {
    if (currentDayFilterRef.current === currentDayFilter) return;

    if (itineraryOverlayRef.current) {
      itineraryOverlayRef.current.setMap(null);
      itineraryOverlayRef.current = null;
    }

    currentDayFilterRef.current = currentDayFilter;

    setFocusedCluster(null);
    setFocusedMarker(null);

    if (
      currentDayFilter !== null &&
      currentDayFilter !== "All" &&
      currentDayFilter !== "Not Set"
    ) {
      if (!timelineOpen) setTimelineOpen(true);

      setCurrentEnglishDate(calculateDateFromDay(currentDayFilter));
    }

    renderMarkers();
    renderOverlays();
  }, [currentDayFilter]);

  const [currentEnglishDate, setCurrentEnglishDate] = useState(null);

  useEffect(() => {
    if (!timelineOpen) setTimelineOpen(true);
  }, [markerPropertyFilters, markers, suggestedMarkers, currentDayFilter]);

  const firstRender = useRef(true);

  const shouldStackClusterIcons = useRef(false);

  const renderMarkers = () => {
    if (!map || !maps || !markers) return;

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

    renderedMarkers.forEach((m) => {
      if (m.isPlacesPOI) {
        m.setMap(null);
      }

      m.overlay?.setMap(null);
    });

    let dayFilters = markerPropertyFilters.filter(
      (f) => f.property === FILTER_PROPERTIES.day
    );

    if (dayFilters.length === 0) {
      dayFilters.push({
        property: FILTER_PROPERTIES.day,
        type: FILTER_TYPE.MATCH,
        value: ["All"],
      });
    }

    let _markers = [...markers];

    // Filter by day first
    for (const filter of dayFilters) {
      _markers = _markers.filter((m) => {
        if (filter.value.length === 1 && filter.value[0] === "All") {
          switch (filter.type) {
            case FILTER_TYPE.MATCH:
            case FILTER_TYPE.INCLUDE:
              return true;
            case FILTER_TYPE.EXCLUDE:
              return false;
          }
        }

        if (filter.value.includes("Not Set") && !m.day) {
          switch (filter.type) {
            case FILTER_TYPE.MATCH:
            case FILTER_TYPE.INCLUDE:
              return true;
            case FILTER_TYPE.EXCLUDE:
              return false;
          }
        }

        // if (!m.time && !m.timelineOverride) return false;

        if (Array.isArray(m.day)) {
          switch (filter.type) {
            case FILTER_TYPE.MATCH:
              return arraysContainSameValues(m.day, filter.value);
            case FILTER_TYPE.INCLUDE:
              return m.day.some((day) => filter.value.includes(day));
            case FILTER_TYPE.EXCLUDE:
              return !m.day.some((day) => filter.value.includes(day));
          }
        } else if (filter.value.includes(m.day)) {
          switch (filter.type) {
            case FILTER_TYPE.MATCH:
              return filter.value.length === 1;
            case FILTER_TYPE.INCLUDE:
              return true;
            case FILTER_TYPE.EXCLUDE:
              return false;
          }
        }
        return false;
      });
    }

    let tagFilters = markerPropertyFilters.filter(
      (f) => f.property === FILTER_PROPERTIES.tags
    );

    if (tagFilters.length === 0) {
      tagFilters.push({
        property: FILTER_PROPERTIES.tags,
        type: FILTER_TYPE.INCLUDE,
        value: ["All"],
      });
    }

    for (const filter of tagFilters) {
      _markers = _markers.filter((m) => {
        if (filter.value.includes("All")) {
          return true;
        }

        if (!m.tags) return false;
        switch (filter.type) {
          case FILTER_TYPE.MATCH:
            return arraysContainSameValues(m.tags, filter.value);
          case FILTER_TYPE.INCLUDE:
            return filter.value.some((tag) => m.tags.includes(tag));
          case FILTER_TYPE.EXCLUDE:
            return !filter.value.some((tag) => m.tags.includes(tag));
        }
      });
    }

    let cityFilters = markerPropertyFilters.filter(
      (f) => f.property === FILTER_PROPERTIES.city
    );

    if (cityFilters.length === 0) {
      cityFilters.push({
        property: FILTER_PROPERTIES.city,
        type: FILTER_TYPE.INCLUDE,
        value: ["All"],
      });
    }

    for (const filter of cityFilters) {
      _markers = _markers.filter((m) => {
        if (filter.value.includes("All")) {
          return true;
        }

        if (!m.city) return false;

        switch (filter.type) {
          case FILTER_TYPE.MATCH:
            return arraysContainSameValues(m.city, filter.value);
          case FILTER_TYPE.INCLUDE:
            return filter.value.some((city) => m.city.includes(city));
          case FILTER_TYPE.EXCLUDE:
            return !filter.value.some((city) => m.city.includes(city));
        }
      });
    }

    let timeFilters = markerPropertyFilters.filter(
      (f) => f.property === FILTER_PROPERTIES.time
    );

    if (timeFilters.length === 0) {
      timeFilters.push({
        property: FILTER_PROPERTIES.time,
        type: FILTER_TYPE.INCLUDE,
        value: ["All"],
      });
    }

    for (const filter of timeFilters) {
      _markers = _markers.filter((m) => {
        if (filter.value.includes("All")) {
          return true;
        }

        if (filter.value.includes("Not Set") && !m.day) {
          switch (filter.type) {
            case FILTER_TYPE.MATCH:
            case FILTER_TYPE.INCLUDE:
              return true;
            case FILTER_TYPE.EXCLUDE:
              return false;
          }
        }

        if (!m.day) return false;

        switch (filter.type) {
          // case FILTER_TYPE.MATCH:
          //   return arraysContainSameValues(m.time, filter.value);
          case FILTER_TYPE.INCLUDE:
            return filter.value.some((time) => m.time === time);
          case FILTER_TYPE.EXCLUDE:
            return !filter.value.some((time) => m.time === time);
          default:
            return false;
        }
      });
    }

    // // Filter for target tags
    // if (includeTagsFilter.length > 0) {
    //   _markers = _markers.filter((m) => {
    //     if (!m.tags) return false;
    //     return includeTagsFilter.some((tag) => m.tags.includes(tag));
    //   });
    // }

    // // Filter out excluded tags
    // if (excludeTagsFilter.length > 0) {
    //   _markers = _markers.filter((m) => {
    //     if (!m.tags) return true;
    //     return !excludeTagsFilter.some((tag) => m.tags.includes(tag));
    //   });
    // }

    // Filter for target info
    // if (markerInfoFilter) {
    //   // _markers = _markers.filter((m) => {
    //   //   return m.info.toLowerCase().includes(markerInfoFilter.toLowerCase());
    //   // });
    // }

    if (suggestedMarkers.length > 0) shouldStackClusterIcons.current = true;
    else shouldStackClusterIcons.current = false;

    _markers = [..._markers, ...suggestedMarkers];

    markers.forEach((m) => {
      if (!_markers.includes(m)) {
        m.setVisible(false);
        m.setMap(null);
      }
    });

    _markers.forEach((m) => {
      if (!m.visible || !m.map) {
        m.setVisible(true);
        m.setMap(map);
      }
    });

    if (markerClusterersRef.current) {
      setClusterersMarkers(_markers);
    }

    renderedMarkersRef.current = _markers;
    setRenderedMarkers(_markers);

    if (_markers.length > 0) {
      centerMap(
        firstRender.current,
        dayFilters.length === 1 &&
          dayFilters[0].value[0] === "All" &&
          suggestedMarkers.length > 0 &&
          focusedMarker !== null
          ? [focusedMarker, ...suggestedMarkers]
          : _markers,
        shouldKeepFocusCenteredRef.current
      );
      // firstRender.current = false;
    }
    // }
  };

  const vignetteRef = useRef(null);

  function smoothFitBounds(finalBounds, onComplete) {
    Logger.BeginLog("smoothFitBounds()", "\n", "finalBounds:", finalBounds);
    Logger.Trace();
    Logger.EndLog();

    let finalCenter = calculateRealCenter();
    if (finalBounds) {
      finalCenter = finalBounds.getCenter();
      // finalBounds = shiftBoundsCenter(finalBounds, finalCenter);
    }
    const adjustBounds = () => {
      if (finalBounds) {
        // finalCenter = calculateRealCenter();
        // finalBounds = shiftBoundsCenter(finalBounds, finalCenter);
        map.fitBounds(finalBounds);

        maps.event.addListenerOnce(map, "idle", () => {
          // finalCenter = calculateRealCenter();
          Logger.Log("smoothFitBounds fitBounds -> idle");
          // map.panTo(finalCenter);
          if (onComplete) onComplete();
        });
      } else {
        Logger.Log("smoothFitBounds no finalBounds or targetBounds");
        if (onComplete) onComplete();
      }
    };

    if (!map.getCenter().equals(finalCenter)) {
      map.panTo(finalCenter);

      maps.event.addListenerOnce(map, "idle", () => {
        Logger.Log("smoothFitBounds panTo -> idle");
        adjustBounds();
      });
    } else {
      adjustBounds();
    }
  }

  function calculateMapCenterAndBounds(markersToCenterOn = null) {
    if (!mapRef.current || !mapsRef.current) return null;

    const boundMarkers = markersToCenterOn
      ? [...markersToCenterOn]
      : focusedClusterRef.current
      ? [...focusedClusterRef.current.markers, ...suggestedMarkersRef.current]
      : focusedMarkerRef.current
      ? [focusedMarkerRef.current, ...suggestedMarkersRef.current]
      : markerInfoFilterRef.current
      ? [
          ...renderedMarkersRef.current.filter((m) => {
            return m.info
              .toLowerCase()
              .includes(markerInfoFilterRef.current.toLowerCase());
          }),
          ...suggestedMarkersRef.current,
        ]
      : isFilteringSingleDay.current
      ? [
          ...renderedMarkersRef.current.filter((m) => m.day),
          ...suggestedMarkersRef.current,
        ]
      : suggestedMarkersRef.current.length > 0
      ? suggestedMarkersRef.current
      : renderedMarkersRef.current;

    let targetBoundMarkers = boundMarkers;

    // if (
    //   markerPropertyFilters.filter(
    //     (f) =>
    //       f.property === FILTER_PROPERTIES.day &&
    //       f.value.length === 1 &&
    //       f.value[0] !== "All"
    //   ).length > 0 &&
    //   suggestedMarkers.length > 0
    // ) {
    //   targetBoundMarkers = suggestedMarkers;
    // }

    var bounds = new maps.LatLngBounds();

    // Extend the bounds to include each marker's position
    for (const marker of targetBoundMarkers) {
      bounds.extend(marker.position);
    }

    return {
      bounds,
      center: bounds.getCenter(),
      boundMarkers: targetBoundMarkers,
    };
  }

  function shiftBoundsCenter(bounds, newCenter) {
    // Get the current center of the bounds
    const currentCenter = bounds.getCenter();

    // Calculate the offset
    const offsetLat = newCenter.lat() - currentCenter.lat();
    const offsetLng = newCenter.lng() - currentCenter.lng();

    // Get the northeast and southwest corners of the bounds
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    // Apply the offset to the corners
    const newNe = new mapsRef.current.LatLng(
      ne.lat() + offsetLat,
      ne.lng() + offsetLng
    );
    const newSw = new mapsRef.current.LatLng(
      sw.lat() + offsetLat,
      sw.lng() + offsetLng
    );

    // Create a new bounds with the new corners
    const newBounds = new mapsRef.current.LatLngBounds(newSw, newNe);

    return newBounds;
  }

  function updateVignette() {
    if (
      focusedMarkerRef.current ||
      suggestedMarkersRef.current.length > 0 ||
      focusedClusterRef.current ||
      isFilteringSingleDay.current
    ) {
      if (shouldVignetteRef.current) {
        // if (true) {
        if (!vignetteRef.current) {
          vignetteRef.current = new vignetteFactoryRef.current.class(
            calculateMapCenterAndBounds().bounds,
            // renderedMarkersRef.current,
            mapRef.current,
            focusedMarkerRef.current ? focusedMarkerRef.current.overlay : null
          );
        } else {
          vignetteRef.current.updateAndRedraw(
            calculateMapCenterAndBounds().bounds,
            // renderedMarkersRef.current,
            focusedMarkerRef.current ? focusedMarkerRef.current.overlay : null,
            mapRef.current
          );
        }
      } else {
        if (vignetteRef.current) vignetteRef.current.setMap(null);
        vignetteRef.current = null;
      }
    } else if (
      !isFilteringSingleDay.current &&
      !focusedMarkerRef.current &&
      !focusedClusterRef.current
    ) {
      // Logger.Log(
      //   "not filtering single day and no focused marker or cluster hiding vignette",
      //   focusedMarker,
      //   focusedCluster
      // );
      if (vignetteRef.current) vignetteRef.current.setMap(null);
      vignetteRef.current = null;
    } else if (
      isFilteringSingleDay.current &&
      !focusedClusterRef.current &&
      !focusedMarkerRef.current
      // && shouldVignetteRef.current
    ) {
      if (shouldVignetteRef.current) {
        // if (true) {
        if (!vignetteRef.current) {
          vignetteRef.current = new vignetteFactoryRef.current.class(
            calculateMapCenterAndBounds().bounds,
            mapRef.current,
            null
          );
        } else {
          vignetteRef.current.updateAndRedraw(
            calculateMapCenterAndBounds().bounds,
            null,
            // renderedMarkersRef.current,
            mapRef.current
          );
        }
      } else {
        if (vignetteRef.current) vignetteRef.current.setMap(null);
        vignetteRef.current = null;
      }
    }
  }

  function centerMap(fitToBounds = false, markersToCenterOn = null) {
    canAdjustMapCenter.current = false;

    const boundsAndCenter = calculateMapCenterAndBounds(markersToCenterOn);

    if (!boundsAndCenter) {
      canAdjustMapCenter.current = true;
      return;
    }

    let { bounds, boundMarkers } = boundsAndCenter;

    Logger.BeginLog(
      "centerMap()",
      "\n",
      "fitToBounds:",
      fitToBounds,
      "\n",
      "markersToCenterOn:",
      markersToCenterOn
    );
    Logger.Trace();
    Logger.Log("focusedMarkerRef.current:", focusedMarkerRef.current);
    Logger.Log("suggestedMarkersRef.current:", suggestedMarkersRef.current);
    Logger.Log(
      "!boundMarkers.every((marker) => mapRef.current.getBounds().contains(marker.position))",
      !boundMarkers.every((marker) =>
        mapRef.current.getBounds().contains(marker.position)
      )
    );
    Logger.Log("isFilteringSingleDay.current:", isFilteringSingleDay.current);
    Logger.EndLog();
    // Logger.Log("checking and adjusting bounds");
    // if (
    //   fitToBounds ||
    //   (focusedMarkerRef.current && suggestedMarkersRef.current.length > 0) ||
    //   (boundMarkers.length > 1 &&
    //     !boundMarkers.every((marker) =>
    //       mapRef.current.getBounds().contains(marker.position)
    //     )) ||
    //   (isFilteringSingleDay.current && boundMarkers.length > 1)
    // ) {
    smoothFitBounds(
      fitToBounds ||
        (focusedMarkerRef.current && suggestedMarkersRef.current.length > 0) ||
        (boundMarkers.length > 1 &&
          !boundMarkers.every((marker) =>
            mapRef.current.getBounds().contains(marker.position)
          )) ||
        (isFilteringSingleDay.current && boundMarkers.length > 1)
        ? bounds
        : undefined,
      () => {
        if (!firstRender.current) canAdjustMapCenter.current = true;
        else firstRender.current = false;
        updateVignette();
      }
    ); // Adjust the viewport if any marker is outside the current view
    // } else {
    //   if (!firstRender.current) canAdjustMapCenter.current = true;
    //   else firstRender.current = false;

    //   updateVignette();
    // }
  }

  const [renderedMarkers, setRenderedMarkers] = useState([]);
  const renderedMarkersRef = React.useRef(renderedMarkers);
  const [timelineActivities, setTimelineActivities] = useState([]);

  const toggleAreasofExploration = () => {
    if (
      timelineActivities.length > 0 &&
      isFilteringSingleDay.current &&
      shouldShowAreasOfExplorationRef.current
    ) {
      if (itineraryOverlayRef.current) {
        itineraryOverlayRef.current.updateAndRedraw(
          timelineActivities.map((a) => a.marker),
          mapRef.current
        );
      } else {
        itineraryOverlayRef.current =
          new itineraryOverlayFactoryRef.current.class(
            timelineActivities.map((a) => a.marker),
            mapRef.current
          );
      }
    } else {
      if (itineraryOverlayRef.current) {
        itineraryOverlayRef.current.setMap(null);
        itineraryOverlayRef.current = null;
      }
    }
  };

  useEffect(() => {
    //   Logger.Log("timelineActivities:", timelineActivities);
    toggleAreasofExploration();
  }, [timelineActivities]);

  useEffect(() => {
    renderedMarkersRef.current = renderedMarkers;
    clear();

    if (currentDayFilter === null) return;

    const activities = renderedMarkers
      .reduce((activities, m) => {
        let { id, info, time, timelineOverride, tags } = m;
        // Check if there's an override for the current day filter
        if (
          timelineOverride &&
          currentDayFilter !== null &&
          timelineOverride[currentDayFilter] !== undefined
        ) {
          if (timelineOverride[currentDayFilter] === null) {
            // If override is null for the current day, use the marker's time
            activities.push({
              id,
              label: info,
              time,
              day: currentDayFilter,
              position: m.position,
              marker: m,
            });
          } else {
            // Use the override for the current day
            activities.push({
              id,
              label: info,
              time: timeOverrideKeys[timelineOverride[currentDayFilter]],
              day: currentDayFilter,
              position: m.position,
              marker: m,
            });
          }
        } else if (
          (timelineOverride && timelineOverride.misc) ||
          (tags !== undefined &&
            tags !== null &&
            tags.includes("Accommodation"))
        ) {
          // Check for miscellaneous override
          if (!timelineOverride) {
            timelineOverride = {
              misc: [1, 4],
            };
          }
          const miscOverride = timelineOverride.misc;
          if (Array.isArray(miscOverride)) {
            // Use the misc override if the current day filter is not found
            miscOverride.forEach((override, index) => {
              activities.push({
                id,
                label: info,
                time: timeOverrideKeys[override],
                day: `misc-${index}`,
                position: m.position,
                marker: m,
              });
            });
          }
        } else if (!activities.some((activity) => activity.id === id) && time) {
          // If there's no override or miscellaneous override, use the marker's time
          activities.push({
            id,
            label: info,
            time,
            day: currentDayFilter,
            position: m.position,
            marker: m,
          });
        }
        return activities;
      }, [])
      .sort((a, b) => timeOrder[a.time] - timeOrder[b.time])
      .map((activity, i) => ({ ...activity, index: i }));

    const days = [];
    const tags = [];
    const cities = [];
    const times = [];

    for (const marker of renderedMarkers) {
      if (marker.day) {
        if (Array.isArray(marker.day)) {
          marker.day.forEach((day) => {
            if (!days.includes(day)) {
              days.push(day);
            }
          });
        } else if (!days.includes(marker.day)) {
          days.push(marker.day);
        }
      }

      if (marker.tags) {
        marker.tags.forEach((tag) => {
          if (!tags.includes(tag)) {
            tags.push(tag);
          }
        });
      }

      if (marker.time) {
        if (!times.includes(marker.time)) {
          times.push(marker.time);
        }
      }

      if (marker.city) {
        marker.city.forEach((city) => {
          if (!cities.includes(city)) {
            cities.push(city);
          }
        });
      }
    }

    tags.sort();
    setAllTags(tags);
    times.sort((a, b) => timeOrder[a] - timeOrder[b]);
    times.push("Not Set");
    setAllTimes(times);
    setAllCities(cities);

    days.sort((a, b) => a - b);
    days.push("Not Set");

    setMarkerDays(days);

    setTimelineActivities(activities);
  }, [renderedMarkers]);

  const [placesService, setPlacesService] = useState(null);
  const placesServiceRef = useRef(null);

  const [directionsService, setDirectionsService] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);

  const [geocoderService, setGeocoderService] = useState(null);

  const vignetteFactoryRef = useRef(null);
  const itineraryOverlayFactoryRef = useRef(null);
  const itineraryOverlayRef = useRef(null);

  const [shouldShowAreasOfExploration, setShouldShowAreasOfExploration] =
    useState(false);
  const shouldShowAreasOfExplorationRef = useRef(shouldShowAreasOfExploration);

  useEffect(() => {
    shouldShowAreasOfExplorationRef.current = shouldShowAreasOfExploration;
    toggleAreasofExploration();
  }, [shouldShowAreasOfExploration]);

  useEffect(() => {
    placesServiceRef.current = placesService;
  }, [placesService]);

  useEffect(() => {
    if (!map || !maps) return;

    if (!directionsService || !directionsRenderer) {
      const _directionsService = new maps.DirectionsService();
      const _directionsRenderer = new maps.DirectionsRenderer({
        suppressMarkers: true,
        supressPolylines: true,
        // polylineOptions: {
        //   strokeColor: "#4169E1",
        //   strokeOpacity: 1,
        //   strokeWeight: 8,
        // },
      });
      setDirectionsService(_directionsService);
      setDirectionsRenderer(_directionsRenderer);
    }

    if (!placesService) {
      const _placesService = new maps.places.PlacesService(map);
      setPlacesService(_placesService);
    }

    if (!geocoderService) {
      const _geocoderService = new maps.Geocoder();
      setGeocoderService(_geocoderService);
    }

    vignetteFactoryRef.current = new CustomVignetteOverlayFactory(maps);
    itineraryOverlayFactoryRef.current = new CustomDistrictOverlayFactory(maps);
  }, [map, maps]);

  const [uniqueCities, setUniqueCities] = useState([]);

  useEffect(() => {
    if (markers && markers.length > 0 && geocoderService) {
      (async () => {
        // const cities = await getUniqueCitiesFromMarkers(
        //   markers,
        //   geocoderService
        // );
        setUniqueCities(["Tokyo, Kyoto, Osaka, Kinosaki"]);
      })();
    }
  }, [markers, geocoderService]);

  function toggleClusterOverlay(active, cluster) {
    if (!cluster || !clusterOverlaysRef.current || !("marker" in cluster))
      return;

    const overlayToShow =
      clusterOverlaysRef.current[getMarkerOverlayKey(cluster, true)];

    if (overlayToShow === undefined || (active && !mapRef.current)) return;

    if (
      (active && overlayToShow.currentPaneType !== "floatPane") ||
      (!active && overlayToShow !== "ovarlayLayer")
    )
      overlayToShow.changePane(
        active && "marker" in cluster && cluster["marker"]["hovered"]
          ? "floatPane"
          : "overlayLayer"
      );

    if (
      (active && overlayToShow.map === null) ||
      (!active && overlayToShow.map !== null)
    )
      overlayToShow.setMap(active ? mapRef.current : null); // Show the overlay associated with the marker
  }

  const { state: routeData, setData: setRouteData } = useRouteDataStore();
  const routeDataRef = React.useRef(routeData);

  useEffect(() => {
    routeDataRef.current = routeData;
  }, [routeData.data]);

  function renderOverlays() {
    if (
      !markerClusterersRef.current ||
      !clusterOverlaysRef.current ||
      !markersRef.current ||
      !mapRef.current
    )
      return;

    const clusteredMarkers = [];
    markerClusterersRef.current.forEach((mc) =>
      mc.clusters.forEach((cluster) => {
        cluster.markers?.forEach((marker) => {
          if (marker !== focusedMarkerRef.current && !marker.hovered) {
            // toggleOverlay(false, marker);
          }
          clusteredMarkers.push(getMarkerOverlayKey(marker));
        });
      })
    );

    const orphanedClusterOverlays = Object.keys(
      clusterOverlaysRef.current
    ).filter(
      (x) =>
        !markerClusterersRef.current.some((mc) =>
          mc.clusters.some((c) => getMarkerOverlayKey(c, true) === x)
        )
    );

    orphanedClusterOverlays.forEach((key) => {
      clusterOverlaysRef.current[key].setMap(null);
      delete clusterOverlaysRef.current[key];
    });

    const anyMarkerHovered = markerClusterersRef.current.some((mc) =>
      mc.clusters.some(
        (c) => c.marker.hovered || c.markers.some((m) => m.hovered)
      )
    );

    markerClusterersRef.current.forEach((mc) =>
      mc.clusters.forEach((cluster) => {
        const isClusterInRoute =
          routeDataRef.current.data.includes(cluster.marker) ||
          cluster.markers.some((m) => routeDataRef.current.data.includes(m));
        const isClusterHovered =
          cluster.marker.hovered || cluster.markers.some((m) => m.hovered);
        const isInFocusedCluster =
          focusedClusterRef.current?.markers.includes(cluster.marker) ||
          cluster.markers?.some((m) =>
            focusedClusterRef.current?.markers?.includes(m)
          ) ||
          (focusedMarkerRef.current &&
            focusedMarkerRef.current === cluster.marker) ||
          (focusedMarkerRef.current &&
            cluster.markers.includes(focusedMarkerRef.current));
        const isClusterInSuggested = suggestedMarkersRef.current.some((m) =>
          cluster.markers.includes(m)
        );

        if (isClusterHovered) {
          cluster.marker.setZIndex(9999);
          cluster.marker.setOptions({ opacity: 1.0 });

          if (
            cluster.marker.hovered &&
            ((focusedMarkerRef.current &&
              !isInFocusedCluster &&
              focusedMarkerRef.current !== cluster.marker &&
              !cluster.markers.some((m) => m === focusedMarkerRef.current)) ||
              !focusedMarkerRef.current)
          ) {
            toggleClusterOverlay(true, cluster);
          }

          if (cluster.markers.length == 1)
            cluster.markers.forEach((m) => toggleOverlay(true, m));
          else if (cluster.markers.some((m) => m.hovered)) {
            let icon;
            cluster.markers.forEach((m) => {
              if (m.hovered) {
                toggleOverlay(true, m);
                // icon = m.icon;
                toggleClusterOverlay(false, cluster);
              }
            });

            // if (icon) cluster.marker.setIcon(icon);
          }
        } else {
          if (
            anyMarkerHovered
            // && !isInFocusedCluster && !isClusterInSuggested
          ) {
            cluster.marker.setOptions({ opacity: 0.2 });
            cluster.marker.setZIndex(undefined);
            toggleClusterOverlay(false, cluster);
            cluster.markers.forEach((m) => toggleOverlay(false, m));
          } else if (
            isInFocusedCluster ||
            isClusterInSuggested ||
            isClusterInRoute
          ) {
            cluster.marker.setOptions({
              opacity: anyMarkerHovered && !cluster.marker.hovered ? 0.2 : 1.0,
              //  : 0.2,
            });
            cluster.marker.setZIndex(
              isInFocusedCluster &&
                (!anyMarkerHovered || cluster.marker.hovered)
                ? 9999
                : undefined
            );
            toggleClusterOverlay(
              // (anyMarkerHovered && !cluster.marker.hovered) ||
              //   focusedClusterRef.current?.markers.includes(cluster.marker) ||
              //   isClusterInSuggested
              //   ?
              isClusterInSuggested && !anyMarkerHovered ? true : false,
              // : true,
              cluster
            );

            cluster.markers.forEach((m) => {
              if (focusedMarkerRef.current === m && !anyMarkerHovered)
                toggleOverlay(true, m);
              else toggleOverlay(false, m);
            });

            if (cluster.markers.length === 1) {
              // cluster.markers.forEach((m) =>
              //   toggleOverlay(
              //     (anyMarkerHovered && !m.hovered) ||
              //       focusedClusterRef.current?.markers.includes(cluster.marker) ||
              //       isClusterInSuggested
              //       ? true
              //       : false,
              //     m
              //   )
              // );
            } else {
              // cluster.markers.forEach((m) => {
              //   if (focusedMarkerRef.current === m && !anyMarkerHovered)
              //     toggleOverlay(true, m);
              //   else toggleOverlay(false, m);
              // });
            }
          } else {
            cluster.marker.setOptions({
              opacity:
                anyMarkerHovered ||
                focusedMarkerRef.current ||
                focusedClusterRef.current
                  ? 0.2
                  : 1.0,
            });
            cluster.marker.setZIndex(undefined);
            toggleClusterOverlay(false, cluster);
            if (cluster.marker)
              cluster.markers.forEach((m) => toggleOverlay(false, m));
          }
        }
      })
    );
  }

  function toggleOverlay(active, marker) {
    const overlayToShow =
      marker.overlay; /*overlaysRef.current[getMarkerOverlayKey(marker)]*/

    // if (active) Logger.Log("toggle overlay: ", marker.overlay);

    if (overlayToShow === undefined || (active && !mapRef.current)) return;

    if (active) {
      let foundInCluster = false;
      markerClusterersRef.current.forEach((mc) =>
        mc.clusters?.forEach((c) => {
          if (foundInCluster) return;

          if (c.marker === marker) {
            foundInCluster = true;
            overlayToShow.location = {
              lat: c.marker.position.lat(),
              lng: c.marker.position.lng(),
            };
            overlayToShow.offsetY = ICON_KEYS[marker.iconKey]
              ? ICON_KEYS[marker.iconKey].offsetY
              : marker.overlayOffsetY
              ? marker.overlayOffsetY
              : 0;
            return;
          }

          c.markers.forEach((m) => {
            if (foundInCluster) return;

            if (m === marker) {
              foundInCluster = true;
              overlayToShow.location = {
                lat: c.marker.position.lat(),
                lng: c.marker.position.lng(),
              };
              overlayToShow.offsetY = ICON_KEYS[marker.iconKey]
                ? ICON_KEYS[marker.iconKey].offsetY
                : marker.overlayOffsetY
                ? marker.overlayOffsetY
                : 0;
              return;
            }
          });
        })
      );

      if (!foundInCluster) {
        overlayToShow.location = {
          lat: marker.position.lat(),
          lng: marker.position.lng(),
        };

        overlayToShow.offsetY = ICON_KEYS[marker.iconKey]
          ? ICON_KEYS[marker.iconKey].offsetY
          : marker.overlayOffsetY
          ? marker.overlayOffsetY
          : 0;
      }
    }

    if (
      (active && overlayToShow.currentPaneType !== "floatPane") ||
      (!active && overlayToShow !== "ovarlayLayer")
    )
      overlayToShow.changePane(
        active && (marker["hovered"] || marker === focusedMarkerRef.current)
          ? "floatPane"
          : "overlayLayer"
      );

    if (
      (active && overlayToShow.map === null) ||
      (!active && overlayToShow.map !== null)
    ) {
      overlayToShow.setMap(active ? mapRef.current : null); // Show the overlay associated with the marker
    }
  }

  const markerHoveredRef = React.useRef(false);

  const onMarkerMouseOver = (marker, index) => {
    markerHoveredRef.current = true;
    marker["hovered"] = true;
    markerClusterersRef.current.forEach((mc) =>
      mc.clusters.forEach((cluster) => {
        cluster.markers.forEach((m) => {
          if (m !== marker) m["hovered"] = false;
        });
      })
    );

    if (
      shouldVignetteRef.current &&
      (!focusedClusterRef.current ||
        (focusedClusterRef.current &&
          !focusedClusterRef.current.markers.includes(marker) &&
          markerClusterersRef.current.forEach(
            (mc) =>
              mc.clusters
                .find((c) => c.markers.includes(marker) || c.marker === marker)
                ?.markers.some((m) =>
                  focusedClusterRef.current.markers.includes(m)
                ) === false
          ))) &&
      (!focusedMarkerRef.current || focusedMarkerRef.current !== marker) &&
      (suggestedMarkersRef.current.length === 0 ||
        (!suggestedMarkersRef.current.includes(marker) &&
          markerClusterersRef.current.forEach(
            (mc) =>
              mc.clusters
                .find((c) => c.markers.includes(marker) || c.marker === marker)
                ?.markers.some((m) =>
                  suggestedMarkersRef.current.includes(m)
                ) === false
          ))) &&
      !isFilteringSingleDay.current
    )
      vignetteRef.current?.setMap(null);

    renderOverlays();
  };

  const onMarkerMouseOut = (marker, index) => {
    marker["hovered"] = false;
    markerHoveredRef.current = false;

    if (
      shouldVignetteRef.current &&
      vignetteRef.current &&
      vignetteRef.current.map === null
    )
      vignetteRef.current.setMap(mapRef.current);

    renderOverlays();
  };

  const [focusedMarker, setFocusedMarker] = useState(null);
  const focusedMarkerRef = React.useRef(null);

  useEffect(() => {
    focusedMarkerRef.current = focusedMarker;

    if (renderedSuggestedMarkers.length > 0) {
      renderedSuggestedMarkers.forEach((m) => m.setMap(null));
      setRenderedSuggestedMarkers([]);

      setClusterersMarkers(renderedMarkers);
    }

    if (focusedMarker) {
      // annoying hack
      focusedMarker.hovered = false;
      setFocusedCluster(null);

      const cluster = markerClusterers?.clusters?.find((c) =>
        c.markers.includes(focusedMarker)
      );

      if (cluster) {
        if (cluster.markers.length > 1) {
          centerMap(true, cluster.markers);
        } else {
          centerMap(false, [focusedMarker]);
        }
      } else {
        centerMap(false, [focusedMarker]);
      }
    } else {
      canAdjustMapCenter.current = false;
    }

    updateVignette();

    // if (!focusedMarker && !focusedCluster) {
    //   if (suggestedMarkers.length > 0) {
    //     suggestedMarkers.forEach((m) => {
    //       if (m.isPlacesPOI) m.setMap(null);
    //     });
    //     setSuggestedMarkers([]);
    //   }
    // }

    renderOverlays();
  }, [focusedMarker]);

  const [focusedCluster, setFocusedCluster] = useState(null);
  const focusedClusterRef = React.useRef(null);

  useEffect(() => {
    focusedClusterRef.current = focusedCluster;

    if (renderedSuggestedMarkers.length > 0) {
      renderedSuggestedMarkers.forEach((m) => m.setMap(null));
      setRenderedSuggestedMarkers([]);

      setClusterersMarkers(renderedMarkers);
    }

    if (focusedCluster) {
      setFocusedMarker(null);
      setSuggestedMarkers([]);
      if (focusedCluster.marker) focusedCluster.marker.hovered = false;
      focusedCluster.markers?.forEach((m) => {
        m["clusterHovered"] = false;
        m["hovered"] = false;
      });

      centerMap(true, focusedCluster.markers);
    } else {
      canAdjustMapCenter.current = false;
    }

    updateVignette();

    if (!focusedCluster) {
      setSuggestingFor(null);
    }

    renderOverlays();
  }, [focusedCluster]);

  const { push, clear, current } = useStackNavigation();

  useEffect(() => {
    // if (!focusedMarker && !focusedCluster) {
    //   clear();
    // }

    return () => {
      clear();
    };
  }, []);

  useEffect(() => {
    if (current) {
      if (current.type === "marker") {
        if (current.target !== focusedMarker) {
          setFocusedCluster(null);
          setFocusedMarker(current.target);
        }
      } else if (current.type === "cluster") {
        if (current.target !== focusedCluster) {
          setFocusedMarker(null);
          setFocusedCluster(current.target);
        }
      }
    }

    renderOverlays();
  }, [current]);

  const onMarkerClick = (marker) => {
    // Get the marker's position
    if (!mapRef.current) return;

    if (disableMarkerFocusingRef.current) {
      Logger.Log("marker focusing disabled");
      return;
    }

    setFocusedCluster(null);
    setFocusedMarker(marker);
    push({ type: "marker", target: marker });
  };

  useEffect(() => {
    if (markers.length == 0 || maps === undefined) return;

    markers.forEach((marker, index) => {
      maps.event.clearListeners(marker, "mouseover");
      // Add a mouseover event listener to the marker
      marker.addListener("mouseover", () => onMarkerMouseOver(marker, index));

      maps.event.clearListeners(marker, "mouseout");
      // Add a mouseout event listener to hide the overlay when the mouse leaves the marker
      marker.addListener("mouseout", () => onMarkerMouseOut(marker, index));

      maps.event.clearListeners(marker, "click");
      marker.addListener("click", () => onMarkerClick(marker));
    });
  }, [markers, maps]);

  function createOverlay({
    map,
    marker,
    title,
    position,
    offsetY,
    offsetX,
    type,
    onClick,
  }) {
    if (!CustomOverlayFactory.current) return;

    let pos = position ?? marker.position;
    const _position =
      typeof pos.lat === "function" && typeof pos.lng === "function"
        ? { lat: pos.lat(), lng: pos.lng() }
        : pos;

    const _title = title ?? marker.title;

    const overlay = new CustomOverlayFactory.current.class(
      null,
      { location: _position, offsetX, offsetY, onClick },
      POILabel,
      {
        title: _title,
        interactable: onClick !== undefined,
      }
    );

    if (map) overlay.setMap(map);
    else overlay.setMap(null);

    return overlay;
  }

  function createMarker({
    label,
    maps,
    map,
    position,
    title,
    placeId,
    icon,
    photo,
    id,
    priority,
    getPlaceDetails = true,
    altPlaceName = null,
  }) {
    const _position = new maps.LatLng(position.lat, position.lng);
    const marker = new maps.Marker({
      label,
      map,
      position: _position,
      title: "",
      icon,
    });
    marker["priority"] = priority;
    marker["info"] = title;
    marker["id"] = id;
    marker["photo"] = photo;
    marker["placeId"] = placeId;
    marker["altPlaceName"] = altPlaceName;

    if (getPlaceDetails && marker["placeId"] === null) {
      Logger.Error("place id is undefined for " + title + " fetching...");
      getPlaceID(marker);
    }
    // else if (getPlaceDetails && marker["photo"] === null) {
    //   getPlacePhoto(marker["placeId"], marker);
    // }

    return marker;
  }

  const getPlaceID = (marker, callback) => {
    let title = marker["info"];
    let altPlaceName = marker["altPlaceName"];
    if (!placesServiceRef.current) return;

    placesServiceRef.current.findPlaceFromQuery(
      {
        query: altPlaceName ?? title,
        fields: ["place_id"],
      },
      function (results, status) {
        if (status === maps.places.PlacesServiceStatus.OK) {
          // Assuming the first result is the one we want
          // Logger.Log("got id for " + title + ": " + results[0].place_id);
          marker["placeId"] = results[0].place_id;
          updateActivityGooglePlaceID(marker, results[0].place_id);
          // if (marker["photo"] === null) {
          //   Logger.Log("photo is undefined for " + title + " getting...");
          //   // getPlacePhoto(marker);
          // }

          if (callback) callback(results[0].place_id);
        } else {
          Logger.Error("could not get id for " + title);
          marker["placeId"] = "INVALID";
          // setMarkersWithoutPhotos([...markersWithoutPhotos, marker]);
          if (callback) callback("INVALID");
        }
      }
    );
    // placesService.current.nearbySearch(
    //   {
    //     location: _position,
    //     radius: 50,
    //     // type: ["point_of_interest"],
    //   },
    //   (results, status) => {
    //     if (status === maps.places.PlacesServiceStatus.OK) {
    //     } else {
    //       Logger.Error("could not get id for " + title);
    //       setMarkersWithoutPhotos([...markersWithoutPhotos, marker]);
    //     }
    //   }
    // );
  };

  const [markersWithoutPhotos, setMarkersWithoutPhotos] = useState([]);

  const [mapLocked, setMapLocked] = useState(false);

  const [googleAccount, setGoogleAccount] = useState(null);
  const [loginPopupOpen, setLoginPopupOpen] = useState(false);
  const [errorPopupOpen, setErrorPopupOpen] = useState(false);

  useEffect(() => {
    if (googleAccount) {
      setLoginPopupOpen(false);
      setErrorPopupOpen(false);
    }
  }, [googleAccount]);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setOptions({
        gestureHandling: mapLocked ? "none" : "greedy",
        scrollwheel: !mapLocked,
        disableDoubleClickZoom: mapLocked,
      });
    }
  }, [mapLocked]);

  const placesPhotosDictRef = React.useRef({});

  function getPlacePhoto(marker, callback = null) {
    if (!placesServiceRef.current) return;

    if (!marker || !marker.placeId || marker.placeId === "INVALID") {
      if (callback) callback([]);
      return;
    }

    const placeId = marker.placeId;

    if (placesPhotosDictRef.current[placeId]) {
      marker["photo"] = placesPhotosDictRef.current[placeId];
      if (callback) callback(placesPhotosDictRef.current[placeId]);
      return;
    }

    placesServiceRef.current.getDetails(
      {
        placeId: placeId,
        fields: ["photo"],
      },
      (place, status) => {
        if (
          status === mapsRef.current.places.PlacesServiceStatus.OK &&
          place.photos &&
          place.photos.length > 0
        ) {
          // Logger.Log(
          //   `got ${place.photos.length} photo(s) for ${marker["info"]}`
          // );
          const photos = place.photos.map((photo) =>
            photo.getUrl({
              maxWidth: 400,
              maxHeight: 400,
            })
          );
          marker["photo"] = photos;
          placesPhotosDictRef.current[placeId] = photos;
          if (callback) callback(photos);
          // updateActivityGooglePlacePhotos(marker, photos);
        } else {
          if (status === "NOT_FOUND") {
            getPlaceID(marker, (placeId) => {
              if (placeId !== "INVALID") {
                getPlacePhoto(marker, callback);
              } else {
                Logger.Error(
                  "could not get photo for " + marker["info"],
                  status
                );
                placesPhotosDictRef.current[placeId] = [];
                marker["photo"] = [];
                if (callback) callback([]);
                setMarkersWithoutPhotos([...markersWithoutPhotos, marker]);
              }
            });
          } else {
            Logger.Error("could not get photo for " + marker["info"], status);
            placesPhotosDictRef.current[placeId] = [];
            marker["photo"] = [];
            if (callback) callback([]);
            setMarkersWithoutPhotos([...markersWithoutPhotos, marker]);
          }
        }
      }
    );
  }

  const clusterOverlaysRef = React.useRef({});

  const onClusterClick = (cluster) => {
    setFocusedCluster(cluster);
    push({ type: "cluster", target: cluster });
  };

  function groupMarkersByCity(markers) {
    let cityMarkerDict = {};
    let addedMarkers = new Set();

    markers.forEach((marker) => {
      if (marker.city) {
        for (const city of marker.city) {
          if (!addedMarkers.has(marker)) {
            if (!cityMarkerDict[city]) {
              cityMarkerDict[city] = [];
            }
            cityMarkerDict[city].push(marker);
            addedMarkers.add(marker);
          }
        }
      }
    });

    return Object.values(cityMarkerDict);
  }

  useEffect(() => {
    if (markers.length === 0 || maps === undefined) return;

    if (markerClusterersRef.current) {
      markerClusterersRef.current.forEach((mc) => mc.clearMarkers());
    }

    const renderer = {
      render: (props, stats, map) => {
        // Logger.BeginLog(
        //   "rendering cluster",
        //   "\n",
        //   "props:",
        //   props,
        //   "\n",
        //   "stats:",
        //   stats
        // );
        // Logger.Trace();
        // Logger.EndLog();

        const { count, markers, _position } = props;

        const center = new mapsRef.current.LatLng(
          _position.lat(),
          _position.lng()
        );

        // Choose the icon based on whether the cluster contains an important marker

        let important;
        let valids = markers.filter((m) => m.iconKey !== undefined);

        if (valids.length > 0)
          important = valids.reduce((prev, curr) => {
            return curr.priority >= prev.priority ? curr : prev;
          });

        let closestMarker = markers[0];
        let minDistance = Number.MAX_VALUE;
        if (!important) {
          // Check for important markers and find the closest marker
          markers.forEach((m) => {
            const distance =
              mapsRef.current.geometry.spherical.computeDistanceBetween(
                center,
                m.position
              );
            if (distance < minDistance) {
              minDistance = distance;
              closestMarker = m;
            }
          });
        }

        if (important) {
          if (ICON_KEYS[important.iconKey].notImportant) {
            important = null;
          }
        }

        if (
          (isFilteringSingleDay.current || !important) &&
          markers.find((m) => m.tags && m.tags.includes("Accommodation"))
        ) {
          important = markers.find(
            (m) => m.tags && m.tags.includes("Accommodation")
          );
        }

        if (
          focusedMarkerRef.current &&
          markers.indexOf(focusedMarkerRef.current) !== -1
        ) {
          important = focusedMarkerRef.current;
        }

        const m = createMarker({
          getPlaceDetails: false,
          maps,
          map,
          title: count + "Marker Cluster",
          position: { lat: _position.lat(), lng: _position.lng() },
          icon: important
            ? important.icon
            : closestMarker
            ? closestMarker.icon
            : null,
        });

        if (important) {
          m["iconType"] = important.iconType;
          m["iconKey"] = important.iconKey;
        } else if (closestMarker) {
          m["iconType"] = closestMarker.iconType;
          m["iconKey"] = closestMarker.iconKey;
        } else {
          m["iconType"] = "default";
        }

        m["clusterCount"] = count;

        m["info"] = important
          ? important.info + " and " + (count - 1) + " more"
          : closestMarker
          ? closestMarker.info + " and " + (count - 1) + " more"
          : count + " markers";

        m["parentMarker"] = important ? important : closestMarker;
        m["childMarkers"] = markers;

        markers.forEach((marker) => {
          marker["parentMarker"] = m;
        });

        m.addListener("mouseover", () => {
          m["parentMarker"]["clusterHovered"] = true;
          onMarkerMouseOver(m);
        });

        m.addListener("mouseout", () => {
          m["parentMarker"]["clusterHovered"] = false;
          onMarkerMouseOut(m);
        });

        m.addListener("click", () => {
          const cluster = { marker: m, markers: markers };
          onClusterClick(cluster);
        });

        // if (markers.find((m) => m.clusterHovered)) m["hovered"] = true;

        if (
          !(
            getMarkerOverlayKey({ marker: m, markers: markers }, true) in
            clusterOverlaysRef.current
          )
        ) {
          const overlay = createOverlay({
            marker: m,
            type: "title",
            title: m.info,
            offsetY:
              important && ICON_KEYS[important.iconKey]
                ? ICON_KEYS[important.iconKey].offsetY
                : 20,
          });

          // overlay.setMap(null);
          clusterOverlaysRef.current[
            getMarkerOverlayKey({ marker: m, markers: markers }, true)
          ] = overlay;
        }

        if (markers.find((m) => m.clusterHovered)) m["hovered"] = true;

        markers.forEach((marker) => {
          marker["hovered"] = false;
          marker["clusterHovered"] = false;
          toggleOverlay(false, marker);
        });

        return m;
      },
    };

    let groupedCityMarkers = groupMarkersByCity(markers);

    const clusterers = [];

    class Clusterer extends MarkerClusterer {
      render() {
        const map = this.getMap();
        if (map && map.getProjection()) {
          mapsRef.current.event.trigger(
            this,
            MarkerClustererEvents.CLUSTERING_BEGIN,
            this
          );
          const { clusters, changed } = this.algorithm.calculate({
            markers: this.markers,
            map,
            mapCanvasProjection: this.getProjection(),
          });

          // Allow algorithms to return flag on whether the clusters/markers have changed.
          if (changed || changed == undefined) {
            // Accumulate the markers of the clusters composed of a single marker.
            // Those clusters directly use the marker.
            // Clusters with more than one markers use a group marker generated by a renderer.
            const singleMarker = new Set();
            for (const cluster of clusters) {
              if (cluster.markers.length == 1) {
                singleMarker.add(cluster.markers[0]);
              }
            }

            const groupMarkers = [];
            // Iterate the clusters that are currently rendered.
            for (const cluster of this.clusters) {
              if (cluster.marker == null) {
                continue;
              }
              if (cluster.markers.length == 1) {
                if (!singleMarker.has(cluster.marker)) {
                  // The marker:
                  // - was previously rendered because it is from a cluster with 1 marker,
                  // - should no more be rendered as it is not in singleMarker.
                  // setTimeout(
                  //   () => MarkerUtils.setMap(cluster.marker, null),
                  //   100
                  // );
                  MarkerUtils.setMap(cluster.marker, null);
                }
              } else {
                // Delay the removal of old group markers to avoid flickering.
                if (
                  cluster.marker !== null &&
                  cluster.marker !== undefined &&
                  cluster.marker.childMarkers
                ) {
                  cluster.marker.childMarkers.forEach((marker) => {
                    marker.parentMarker = null;
                  });
                }
                groupMarkers.push(cluster.marker);
              }
            }

            this.clusters = clusters;
            this.renderClusters();

            // Delayed removal of the markers of the former groups.
            setTimeout(
              () =>
                groupMarkers.forEach((marker) => {
                  MarkerUtils.setMap(marker, null);
                }),
              100
            );
          }
          mapsRef.current.event.trigger(
            this,
            MarkerClustererEvents.CLUSTERING_END,
            this
          );
        }
      }

      renderClusters() {
        // Generate stats to pass to renderers.
        const stats = new ClusterStats(this.markers, this.clusters);
        const map = this.getMap();

        this.clusters.forEach((cluster) => {
          if (cluster.markers.length === 1) {
            // Logger.Log("rendering single marker cluster", cluster.markers[0]);
            cluster.marker = cluster.markers[0];
          } else {
            // Generate the marker to represent the group.
            cluster.marker = this.renderer.render(cluster, stats, map);
            // Make sure all individual markers are removed from the map.
            cluster.markers.forEach((marker) =>
              MarkerUtils.setMap(marker, null)
            );
            if (this.onClusterClick) {
              cluster.marker.addListener(
                "click",
                /* istanbul ignore next */
                (event) => {
                  mapsRef.current.event.trigger(
                    this,
                    MarkerClustererEvents.CLUSTER_CLICK,
                    cluster
                  );
                  this.onClusterClick(event, cluster, map);
                }
              );
            }
          }
          MarkerUtils.setMap(cluster.marker, map);
        });
      }
    }

    groupedCityMarkers.forEach((markers) => {
      const markerClusterer = new Clusterer({
        markers,
        map,
        algorithm: new SuperClusterAlgorithm({ radius: 80, extent: 256 }),
        renderer,
        // zoomOnClick: false,
        onClusterClick: null,
      });

      maps.event.addListener(markerClusterer, "clusteringend", () => {
        renderOverlays();
      });
      clusterers.push(markerClusterer);
    });

    setMarkerClusterers(clusterers);

    return () => {
      if (maps) {
        clusterers.forEach((clusterer) => {
          maps.event.clearListeners(clusterer, "clusteringend");
          clusterer.clearMarkers();
        });
      }
    };
  }, [maps, markers]);

  const onGoogleApiLoaded = ({ map, maps }) => {
    // const data = JSON.parse(JSON.stringify(testData));

    setMaps(maps);
    setMap(map);
  };

  const [currentMapStyle, setCurrentMapStyle] = useState("default");

  useEffect(() => {
    if (!map || !maps) return;

    if (currentMapStyle === "default") {
      map.setOptions({ styles: JSON.parse(JSON.stringify(DefaultStyle)) });
    } else if (currentMapStyle === "transit") {
      map.setOptions({ styles: JSON.parse(JSON.stringify(TransitStyle)) });
    }
  }, [currentMapStyle]);

  const [currentRenderType, setCurrentRenderType] = useState("roadmap");

  useEffect(() => {
    if (!map || !maps) return;

    if (currentRenderType === "roadmap") {
      map.setMapTypeId(maps.MapTypeId.ROADMAP);
    } else if (currentRenderType === "satellite") {
      map.setMapTypeId(maps.MapTypeId.SATELLITE);
      setCurrentMapStyle("default");
    }
  }, [currentRenderType]);

  // const [filtersOpen, setFiltersOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [timelineVisible, setTimelineVisible] = useState(true);
  const timelineVisibleRef = React.useRef(true);

  useEffect(() => {
    if (!map || !maps) return;

    timelineVisibleRef.current = timelineVisible;

    setTimeout(() => {
      centerMap();
    }, 100);
  }, [timelineVisible]);

  const updateFilters = (property, value) => {
    let newFilters = markerPropertyFilters.filter((filter) => {
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
      const filterOfProperty = markerPropertyFilters.find((filter) => {
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

    setMarkerPropertyFilters(newFilters);
  };

  const [shouldVignette, setShouldVignette] = useState(false);
  const shouldVignetteRef = React.useRef(false);

  useEffect(() => {
    var prev = shouldVignetteRef.current;
    shouldVignetteRef.current = shouldVignette;

    if (prev !== shouldVignetteRef.current) centerMap(false, null);
  }, [shouldVignette]);

  const [shouldKeepFocusCentered, setShouldKeepFocusCentered] = useState(false);
  const shouldKeepFocusCenteredRef = React.useRef(false);

  useEffect(() => {
    // var prev = shouldKeepFocusCenteredRef.current;
    shouldKeepFocusCenteredRef.current = shouldKeepFocusCentered;
    if (shouldKeepFocusCentered === true) centerMap(false, null);
  }, [shouldKeepFocusCentered]);

  const [routing, setRouting] = useState(false);
  const [travelMode, setTravelMode] = useState("DRIVING");

  const [disableMarkerFocusing, setDisableMarkerFocusing] = useState(false);
  const disableMarkerFocusingRef = React.useRef(false);
  useEffect(() => {
    disableMarkerFocusingRef.current = disableMarkerFocusing;
  }, [disableMarkerFocusing]);

  if (!fetchedAPIKey) return null;

  return (
    <React.Fragment>
      <AppHeader
        setFocusedCluster={(c) => {
          setFocusedMarker(null);
          setFocusedCluster(c);
        }}
        setFocusedMarker={(m) => {
          setFocusedCluster(null);
          setFocusedMarker(m);
        }}
        markers={renderedMarkers}
        noLocationItems={noLocationItems}
        allCities={allCities}
        markerDays={markerDays}
        allTags={allTags}
        allTimes={allTimes}
        focusedMarker={focusedMarker}
        focusedCluster={focusedCluster}
        currentFilters={markerPropertyFilters}
        onSearch={(search) => {
          if (search === "") {
            setFocusedMarker(null);
            setFocusedCluster(null);
            setMarkerInfoFilter(null);

            if (renderedSuggestedMarkers.length > 0) {
              renderedSuggestedMarkers.forEach((m) => m.setMap(null));
              setRenderedSuggestedMarkers([]);

              setClusterersMarkers(renderedMarkers);
            }
          } else {
            if (markers.filter((m) => m.info === search).length === 1) {
              setFocusedMarker(markers.find((m) => m.info === search));
            } else if (
              search.includes("City") ||
              search.includes("Tag") ||
              search.includes("Time") ||
              search.includes("Day")
            ) {
              if (search.includes("City")) {
                updateFilters(
                  FILTER_PROPERTIES.city,
                  search.replace("City: ", "")
                );
              } else if (search.includes("Tag")) {
                updateFilters(
                  FILTER_PROPERTIES.tags,
                  search.replace("Tag: ", "")
                );
              } else if (search.includes("Time")) {
                updateFilters(
                  FILTER_PROPERTIES.time,
                  search.replace("Time: ", "")
                );
              } else if (search.includes("Day")) {
                updateFilters(
                  FILTER_PROPERTIES.day,
                  !search.includes("Not")
                    ? Number.parseInt(search.replace("Day: ", "").trim())
                    : search
                );
              }
            } else setMarkerInfoFilter(search);
          }
        }}
        onFilterEdit={(filters) => {
          setMarkerPropertyFilters(filters);
        }}
        onFiltersOpen={(open) => {
          // setTimelineHidden(open);
          // setFiltersOpen(open);
        }}
        suggestingFor={suggestingFor}
        timelineActivities={
          currentDayFilter === "All" || currentDayFilter === "Not Set"
            ? null
            : timelineActivities
        }
        mapsService={maps}
        onActivityClick={onMarkerClick}
        allMarkers={markers}
        onSetSuggested={(markers) => {
          setSuggestedMarkers(markers);
        }}
        onActivityMouseOver={onMarkerMouseOver}
        onActivityMouseOut={onMarkerMouseOut}
        placesService={placesService}
        createOverlay={createOverlay}
        geocoderService={geocoderService}
        googleAccount={googleAccount}
        setLoginPopupOpen={setLoginPopupOpen}
        currentDayFilter={currentDayFilter}
        routing={routing}
        setRouting={setRouting}
        travelMode={travelMode}
        map={map}
        directionsRenderer={directionsRenderer}
        directionsService={directionsService}
        setTravelMode={setTravelMode}
        disableMarkerFocusing={disableMarkerFocusing}
        setDisableMarkerFocusing={setDisableMarkerFocusing}
        calculateDayFromDate={calculateDayFromDate}
      />
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexFlow: "column",
          position: "relative",
        }}
      >
        <GoogleMapReact
          options={createOptions}
          bootstrapURLKeys={{
            key: fetchedAPIKey,
            language: "en",
            region: "US",
            libraries: ["places", "routes", "geometry", "geocoder"],
          }}
          defaultCenter={defaultProps.center}
          defaultZoom={defaultProps.zoom}
          yesIWantToUseGoogleMapApiInternals
          onGoogleApiLoaded={onGoogleApiLoaded}
          // layerTypes={["TransitLayer"]}
        ></GoogleMapReact>
        {/* Timeline */}
        {
          // (!focusedMarker &&
          currentDayFilter !== null &&
            currentDayFilter !== "All" &&
            currentDayFilter !== "Not Set" && (
              // ||
              // focusedMarker ||
              // (suggestedMarkers && suggestedMarkers.length > 0))
              <ItineraryTimeline
                timelineActivities={
                  currentDayFilter === "All" || currentDayFilter === "Not Set"
                    ? null
                    : timelineActivities
                }
                directionsRenderer={directionsRenderer}
                directionsService={directionsService}
                mapsService={maps}
                map={map}
                currentDayFilter={currentDayFilter}
                allDays={markerDays}
                markerPropertyFilters={markerPropertyFilters}
                setMarkerPropertyFilters={setMarkerPropertyFilters}
                onActivityClick={onMarkerClick}
                onActivityMouseOver={onMarkerMouseOver}
                onActivityMouseOut={onMarkerMouseOut}
                open={timelineOpen}
                onSetOpen={setTimelineVisible}
                englishDate={currentEnglishDate}
                routing={routing}
                setRouting={setRouting}
                travelMode={travelMode}
                setTravelMode={setTravelMode}
              />
            )
        }
        <AppFooter
          currentMapStyle={currentMapStyle}
          currentRenderType={currentRenderType}
          setCurrentMapStyle={setCurrentMapStyle}
          setCurrentRenderType={setCurrentRenderType}
          focusedCluster={focusedCluster}
          focusedMarker={focusedMarker}
          timelineActivities={
            currentDayFilter === "All" || currentDayFilter === "Not Set"
              ? null
              : timelineActivities
          }
          setMapLocked={setMapLocked}
          mapLocked={mapLocked}
          allMarkers={markers}
          onDrawerClose={() => {
            // setFocusedMarker(null);
            // setFocusedCluster(null);
            // if (mapRef.current) mapRef.current.setZoom(13);
          }}
          setFocusedMarker={(m) => {
            setFocusedCluster(null);
            setFocusedMarker(m);
          }}
          googleAccount={googleAccount}
          onUpdateDate={(date) => {
            if (!focusedMarker) return;

            renderMarkers();
            updateActivityDate(focusedMarker, googleAccount);
          }}
          onUpdateTitle={(title) => {
            if (!focusedMarker) return;

            updateActivityTitle(focusedMarker, googleAccount);
            focusedMarker.overlay?.updateProps({
              title: title,
            });
          }}
          calculateDay={calculateDay}
          setLoginPopupOpen={setLoginPopupOpen}
          setErrorPopupOpen={setErrorPopupOpen}
          allTags={allTags}
          onTagsUpdated={(tags) => {
            if (!focusedMarker) return;

            updateActivityTags(focusedMarker, googleAccount);
          }}
          allTimes={allTimes}
          onTimeUpdated={(time) => {
            if (!focusedMarker) return;

            renderMarkers();
            updateActivityTime(focusedMarker, googleAccount);
          }}
          currentDayFilter={currentDayFilter}
          onRecenterMap={() => {
            Logger.Log("onRecenterMap()");
            centerMap(true, null);
          }}
          centerOnUserLocation={() => {
            if (curUserLocation.current) {
              map.panTo(curUserLocation.current);
            } else {
              getUserLocation();
            }
          }}
          setShouldVignette={setShouldVignette}
          shouldVignette={shouldVignette}
          setShouldKeepFocusCentered={setShouldKeepFocusCentered}
          shouldKeepFocusCentered={shouldKeepFocusCentered}
          shouldShowAreasOfExploration={shouldShowAreasOfExploration}
          setShouldShowAreasOfExploration={setShouldShowAreasOfExploration}
        />
      </div>
      <MapDrawer
        focusedCluster={focusedCluster}
        focusedMarker={focusedMarker}
        setMapLocked={setMapLocked}
        getPlacePhotos={getPlacePhoto}
        mapLocked={mapLocked}
        allMarkers={markers}
        onDrawerClose={() => {
          setFocusedMarker(null);
          setFocusedCluster(null);

          if (mapRef.current) mapRef.current.setZoom(13);
        }}
        setFocusedMarker={(m) => {
          setFocusedCluster(null);
          setFocusedMarker(m);
        }}
        googleAccount={googleAccount}
        onUpdateDate={(date) => {
          if (!focusedMarker) return;

          renderMarkers();
          updateActivityDate(focusedMarker, googleAccount);
        }}
        onUpdateTitle={(title) => {
          if (!focusedMarker) return;

          updateActivityTitle(focusedMarker, googleAccount);
          focusedMarker.overlay.updateProps({
            title: title,
          });
        }}
        calculateDay={calculateDay}
        setLoginPopupOpen={setLoginPopupOpen}
        allTags={allTags}
        onTagsUpdated={(tags) => {
          if (!focusedMarker) return;

          updateActivityTags(focusedMarker, googleAccount);
        }}
        allTimes={allTimes}
        onTimeUpdated={(time) => {
          if (!focusedMarker) return;

          renderMarkers();
          updateActivityTime(focusedMarker, googleAccount);
        }}
        currentDayFilter={currentDayFilter}
        onNewActivity={(marker) => {
          updateActivityGooglePlaceID(marker, marker.placeId ?? "");
          setMarkers([...markers, marker]);
        }}
        onNewEmojiIconSet={(marker, emoji) => {
          createEmojiIcon(emoji, (img) => {
            marker.setIcon({
              url: img,
              scaledSize: new mapsRef.current.Size(100, 100), // size of the icon
              origin: new mapsRef.current.Point(0, 0), // origin
              anchor: new mapsRef.current.Point(50, 50), // anchor
            });

            marker["overlayOffsetY"] = 20;

            marker.overlay?.updateOffsetY(20);
          });

          updateActivityEmojiIcon(marker, emoji, googleAccount);
        }}
        onConfirmDelete={(marker) => {
          marker.overlay?.setMap(null);
          marker.setMap(null);
          setMarkers(markers.filter((m) => m.id !== marker.id));
          setFocusedMarker(null);
          deleteActivity(marker, googleAccount);
        }}
        onClose={() => {
          // setFocusedMarker(null);
          // setFocusedCluster(null);
        }}
        onActivityMouseOver={onMarkerMouseOver}
        onActivityMouseOut={onMarkerMouseOut}
      />
      <GoogleSignIn
        onGoogleAccount={(googleAccount) => setGoogleAccount(googleAccount)}
        loginPopupOpen={loginPopupOpen}
        setLoginPopupOpen={setLoginPopupOpen}
        errorPopupOpen={errorPopupOpen}
        setErrorPopupOpen={setErrorPopupOpen}
        onLoginClicked={() => {
          if (timelineOpen) setTimelineOpen(false);
        }}
      />
    </React.Fragment>
  );
};

export default MapView;
