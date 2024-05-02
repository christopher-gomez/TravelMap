import React, { useEffect, useRef, useState } from "react";
import GoogleMapReact from "google-map-react";
// import testData from "./MapTestData.json";
import TransitStyle from "./MapStyles/TransitStyle.json";
import DefaultStyle from "./MapStyles/DefaultStyle.json";

import { MarkerClusterer } from "@googlemaps/markerclusterer";

import { queryDatabase, updatePage } from "../Api/Notion";
import { NOTION_QUERY } from "./NotionMapQueryParams";
import { getGoogleMapsApiKey } from "../Api/Maps";
import CustomOverlayContainerFactory from "./POI/CustomOverlayContainerClass";
import POILabel from "./POI/POILabel";
import ICON_KEYS from "./POI/IconMapKeys";
import POIDetailsCard from "./POI/POIDetails";
import SpeedDial from "../Util/SpeedDial";

import Timeline from "../Util/Timeline";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ForkLeftIcon from "@mui/icons-material/ForkLeft";
import CancelIcon from "@mui/icons-material/Cancel";
import AppHeader from "./Header/MapHeader";
import { FILTER_PROPERTIES, FILTER_TYPE } from "./Header/FilterDialog";
import SwipeableEdgeDrawer from "../Util/SwipeableEdgeDrawer";
import AppFooter from "./Footer/AppFooter";

// import {
//   findLocationLngLat,
//   updateLocationProperties,
// } from "./UpdateLocationProperties";
// import fetchNotionPage from "../util/api";

// import PlacesData from "./data.json";

const OVERLAYS_ALWAYS_VISIBLE_ZOOM_LEVEL = 100;
const timeOrder = {
  "All Day": 0,
  Morning: 1,
  Afternoon: 2,
  Evening: 3,
  Night: 4,
};

const timeOverrideKeys = {
  0: "All Day",
  1: "Morning",
  2: "Afternoon",
  3: "Evening",
  4: "Night",
};

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

  useEffect(() => {
    const fetchAPIKey = async () => {
      if (fetchingKey) return;

      setFetchingKey(true);

      const key = await getGoogleMapsApiKey();

      setFetchedAPIKey(key);
      setFetchingKey(false);
    };

    const fetchItineraryData = async () => {
      const query = await queryDatabase(NOTION_QUERY);
      if (query.results && query.results.length > 0) {
        // console.log("Itinerary data fetched", query);
        setItineraryData(query.results);
        // console.log(query.results);

        // const data = JSON.parse(JSON.stringify(PlacesData));

        // const mappedData = data.map((item) => ({
        //   id: item.id,
        //   location: item.location,
        // }));

        // console.log(mappedData)

        // await updateLocationProperties(mappedData);

        // console.log(JSON.stringify(query, null, 2));
      }
    };

    if (!fetchedAPIKey) fetchAPIKey();

    if (!itineraryData) fetchItineraryData();
  }, []);

  // useEffect(() => {
  //   if (itineraryData) {
  //     console.log("Itinerary data set");
  //     console.log(itineraryData);

  //     // console.log("Updating Tokyo Sea Location");
  //     // updateLocationProperties([
  //     //   {
  //     //     id: "7cd51447-b7d9-4cc8-bda2-c72abfe3178f",
  //     //     location: "35.62689390735521, 139.8850886246371",
  //     //   },
  //     // ]);

  //     var places = [];
  //     itineraryData.forEach((item) => {
  //       places.push(item.properties.Activity.title[0].plain_text);
  //       // console.log(item.properties.Activity.title[0].plain_text);
  //       // console.log(item.properties.Name.title[0].plain_text);
  //     });
  //     console.log(places);
  //   }
  // }, [itineraryData]);

  const createOptions = (maps) => {
    const styles = JSON.parse(JSON.stringify(DefaultStyle));
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
            city:
              item.properties.City.multi_select.length > 0
                ? item.properties.City.multi_select.map((city) => city.name)
                : null,
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
          city:
            item.properties.City.multi_select.length > 0
              ? item.properties.City.multi_select.map((city) => city.name)
              : null,
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

  const createMarkers = (data, map, maps) => {
    const markers = [];
    const overlays = {};
    let index = 0;
    for (const item of data) {
      const marker = createMarker({
        maps,
        map,
        position: item.position,
        icon:
          typeof item.icon !== "object" &&
          !Array.isArray(item.icon) &&
          item.icon !== null &&
          item.icon in ICON_KEYS
            ? {
                url: ICON_KEYS[item.icon].url,
                scaledSize: new maps.Size(
                  ICON_KEYS[item.icon].scaledSize[0],
                  ICON_KEYS[item.icon].scaledSize[1]
                ),
              }
            : item.icon !== null
            ? item.icon.type === "emoji"
              ? {
                  url:
                    "data:image/svg+xml;charset=UTF-8," +
                    encodeURIComponent(
                      `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><text y="50%" x="50%" dominant-baseline="middle" text-anchor="middle" font-size="40">${item.icon.value}</text></svg>`
                    ),
                  scaledSize: new mapsRef.current.Size(100, 100), // size of the icon
                  origin: new mapsRef.current.Point(0, 0), // origin
                  anchor: new mapsRef.current.Point(50, 50), // anchor
                }
              : {
                  url: item.icon,
                  scaledSize: new mapsRef.current.Size(100, 100), // size of the icon
                  origin: new mapsRef.current.Point(0, 0), // origin
                  anchor: new mapsRef.current.Point(50, 50), // anchor
                }
            : null,
        priority: item.priority,
      });

      if (item.icon && item.icon in ICON_KEYS) marker["iconKey"] = item.icon;

      marker["info"] = item.title;
      marker["description"] = item.description;
      marker["tags"] = item.tags;
      marker["date"] = item.date;
      marker["day"] = calculateDay(item.date);
      marker["time"] = item.time;
      marker["id"] = item.id;
      marker["timelineOverride"] = item.timelineOverride;
      marker["city"] = item.city;

      markers.push(marker);

      const overlay = createOverlay({
        marker: item,
        type: "title",
        offsetY:
          item.icon !== null && item.icon in ICON_KEYS
            ? ICON_KEYS[item.icon].offsetY
            : 20,
      });

      // populateInfoWindow(infoDiv, "Header Info", "Title", "This is the main content body.", "Other relevant information.");
      overlays[getMarkerOverlayKey(marker)] = overlay;
      index++;
    }

    setMarkers(markers);
    setOverlays(overlays);
  };

  const CustomOverlayFactory = useRef(null);

  useEffect(() => {
    if (itineraryData !== null && map !== undefined && maps !== undefined) {
      CustomOverlayFactory.current = new CustomOverlayContainerFactory(maps);
      const places = parseItineraryDataLocations(itineraryData);
      createMarkers(places, map, maps);
      // createMarkers(itineraryData);
    }
  }, [itineraryData, map, maps]);

  function onPan() {
    if (focusedMarkerRef.current && mapRef.current) {
      const bounds = mapRef.current.getBounds();
      const focusedMarkerPosition = focusedMarkerRef.current.getPosition();
      const isMarkerVisible = bounds.contains(focusedMarkerPosition);

      if (!isMarkerVisible) {
        // console.log("marker no longer visible, setting null");
        setFocusedMarker(null);
      }
    }

    if (focusedClusterRef.current && mapRef.current && mapsRef.current) {
      const mapBounds = mapRef.current.getBounds();

      let isClusterVisible = true;
      let totalMarkers = 0;
      for (const marker of focusedClusterRef.current.markers) {
        if (!mapBounds.contains(marker.getPosition())) {
          toggleOverlay(false, marker);
          totalMarkers++;
        }
      }

      if (totalMarkers === focusedClusterRef.current.markers.length)
        isClusterVisible = false;

      if (!isClusterVisible) {
        setFocusedCluster(null);
      }
    }

    // markersRef.current.forEach((m, i) => m.setVisible(true));
    // renderMarkers();
  }

  useEffect(() => {
    mapRef.current = map;

    if (map) {
      map.addListener("dragend", onPan);
      // map.maxZoom = 20;
      map.addListener("bounds_changed", () => {
        if (map.getZoom() > 20) {
          map.setZoom(20);
        }
      });
    }
  }, [map]);

  useEffect(() => {
    mapsRef.current = maps;
  }, [maps]);

  // const transRef = React.useRef(null);
  const [directionsService, setDirectionsService] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);

  const [preferredTravelMode, setPreferredTravelMode] = useState(null);

  function calculateRoute(start, end, waypoints) {
    if (!directionsService || !directionsRenderer) return;

    const mileThreshold = 1; // 1 mile
    const distanceInMeters =
      mapsRef.current.geometry.spherical.computeDistanceBetween(start, end);
    const distanceInMiles = distanceInMeters * 0.000621371;

    const travelMode =
      preferredTravelMode ?? distanceInMiles <= mileThreshold
        ? "WALKING"
        : "DRIVING";

    const request = {
      origin: start,
      destination: end,
      travelMode,
      waypoints: waypoints,
    };

    directionsService.route(request, (result, status) => {
      if (status === "OK") {
        directionsRenderer.setMap(mapRef.current);
        directionsRenderer.setDirections(result);
      }
    });
  }

  // useEffect(() => {
  //   (async () => {
  //     if (maps !== undefined && itineraryData !== null) {
  //       const places = [];
  //       for (const item of itineraryData) {
  //         try {
  //           const result = await findLocationLngLat(
  //             maps,
  //             item.properties.Activity.title[0].plain_text
  //           );

  //           console.log(result);

  //           places.push({
  //             activity: item.properties.Activity.title[0].plain_text,
  //             id: item.id,
  //             location: `${result.lat()}, ${result.lng()}`,
  //           });
  //         } catch (error) {
  //           console.log(error);
  //         }
  //       }
  //       console.log(places);
  //     }
  //   })();
  // }, [maps, itineraryData]);

  const [markers, setMarkers] = useState([]);
  const markersRef = React.useRef(markers);
  const [overlays, setOverlays] = useState({});
  const overlaysRef = React.useRef(overlays);
  const [markerCluster, setMarkerCluster] = useState(undefined);
  const markerClusterRef = React.useRef(markerCluster);
  const [currentZoom, setCurrentZoom] = useState(0);
  const currentZoomRef = React.useRef(currentZoom);

  useEffect(() => {
    markerClusterRef.current = markerCluster;
  }, [markerCluster]);

  const calculateDay = (activityDate) => {
    if (!activityDate) return null;

    const tripStart = new Date(tripDateRange.current.start);
    const activityStart = new Date(activityDate.start);
    const activityEnd = activityDate.end
      ? new Date(activityDate.end)
      : activityStart;

    // Calculate the start and end day numbers
    const startDay =
      Math.ceil((activityStart - tripStart) / (1000 * 60 * 60 * 24)) + 1;
    const endDay =
      Math.ceil((activityEnd - tripStart) / (1000 * 60 * 60 * 24)) + 1;

    // Generate an array of day numbers if there are multiple days
    if (startDay !== endDay) {
      const dayNumbers = [];
      for (let i = startDay; i <= endDay; i++) {
        dayNumbers.push(i);
      }
      return dayNumbers;
    }

    // If the activity is only one day, return an array with that single number
    return startDay;
  };

  const tripDateRange = useRef(null);

  const [markerDays, setMarkerDays] = useState([]);

  useEffect(() => {
    if (markersRef.current.length > 0) {
      markersRef.current.forEach((m) => {
        m.setVisible(false);
        m.setMap(null);

        if (overlaysRef.current[getMarkerOverlayKey(m)]) {
          overlaysRef.current[getMarkerOverlayKey(m)].setMap(null);
          overlaysRef.current[getMarkerOverlayKey(m)] = null;
          delete overlaysRef.current[getMarkerOverlayKey(m)];
        }

        m = null;
      });
    }

    const days = [];
    const tags = [];
    const cities = [];

    for (const marker of markers) {
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

      if (marker.city) {
        marker.city.forEach((city) => {
          if (!cities.includes(city)) {
            cities.push(city);
          }
        });
      }
    }

    setAllTags(tags);
    setAllCities(cities);

    days.sort((a, b) => a - b);
    // days.unshift("All");
    days.push("General");

    setMarkerDays(days);
    markersRef.current = markers;
  }, [markers]);

  const [currentDayFilter, setCurrentDayFilter] = useState(null);
  const [allTags, setAllTags] = useState([]);
  const [allCities, setAllCities] = useState([]);
  // const [cityFilter, setCityFilter] = useState("All");
  // const [includeTagsFilter, setIncludeTagsFilter] = useState([]);
  // const [excludeTagsFilter, setExcludeTagsFilter] = useState([]);

  const [markerPropertyFilters, setMarkerPropertyFilters] = useState([]);

  const [markerInfoFilter, setMarkerInfoFilter] = useState(null);

  useEffect(() => {
    if (
      markerPropertyFilters.length === 0 ||
      markerPropertyFilters.filter((f) => f.property === FILTER_PROPERTIES.day)
        .length === 0 ||
      markerPropertyFilters
        .filter((f) => f.property === FILTER_PROPERTIES.day)
        .find((f) => f.value.includes("All"))
    ) {
      setCurrentDayFilter("All");
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
      setCurrentDayFilter(
        markerPropertyFilters.filter(
          (f) =>
            f.property === FILTER_PROPERTIES.day && //f.type === FILTER_TYPE.MATCH ||
            f.type === FILTER_TYPE.INCLUDE
        )[0].value[0]
      );
    } else {
      setCurrentDayFilter(null);
    }
  }, [markerPropertyFilters]);

  useEffect(() => {
    // console.log("Current Day Filter");
    // console.log(currentDayFilter);
  }, [currentDayFilter]);

  useEffect(() => {
    // setCurrentDayFilter("All");
    setMarkerPropertyFilters([]);
  }, [markerDays]);

  useEffect(() => {
    if (!markers || !maps || !map) return;

    setRouting(false);
    setRenderedMarkers([]);
    renderMarkers();
  }, [
    // currentDayFilter,
    // includeTagsFilter,
    // excludeTagsFilter,
    markerPropertyFilters,
    markerInfoFilter,
    markers,
  ]);

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

    markers.forEach((marker, index) => {
      marker.setVisible(false);
      marker.setMap(null);
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
        if (filter.value.includes("General") && !m.day) {
          switch (filter.type) {
            case FILTER_TYPE.MATCH:
            case FILTER_TYPE.INCLUDE:
              return true;
            case FILTER_TYPE.EXCLUDE:
              return false;
          }
        }

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
    if (markerInfoFilter) {
      _markers = _markers.filter((m) => {
        return m.info.toLowerCase().includes(markerInfoFilter.toLowerCase());
      });
    }

    _markers.forEach((m) => {
      if (!m.visible || !m.map) {
        m.setVisible(true);
        m.setMap(map);
      }
    });

    if (
      markerClusterRef.current &&
      _markers !== markerClusterRef.current.markers
    ) {
      markerClusterRef.current.clearMarkers();
      markerClusterRef.current.addMarkers(_markers);
    }

    setRenderedMarkers(_markers);

    if (_markers.length > 0) {
      if (_markers.length === 1) {
        // console.log("render markers setting focused marker index 0");
        setFocusedMarker(_markers[0]);
        offsetCenter(_markers[0].position, 0, 70);
        return;
      }

      var bounds = new maps.LatLngBounds();
      //extend the bounds to include each marker's position
      for (const marker of _markers) bounds.extend(marker.position);

      map.fitBounds(
        bounds,
        dayFilters.length === 1 && dayFilters[0].value.includes("All") ? 0 : 300
      );
    }
  };

  const [renderedMarkers, setRenderedMarkers] = useState([]);
  const [timelineActivities, setTimelineActivities] = useState([]);

  useEffect(() => {
    if (currentDayFilter === null) return;

    // console.log("setting timeline activities");

    const activities = renderedMarkers
      .reduce((activities, m) => {
        const { id, info, time, timelineOverride } = m;
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
        } else if (timelineOverride && timelineOverride.misc) {
          // Check for miscellaneous override
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
    setTimelineActivities(activities);
  }, [renderedMarkers]);

  useEffect(() => {
    overlaysRef.current = overlays;
  }, [overlays]);

  useEffect(() => {
    if (!currentZoom) return;

    currentZoomRef.current = currentZoom;

    renderOverlays();
  }, [currentZoom]);

  const zoomingRef = React.useRef(false);

  const onZoom = () => {
    zoomingRef.current = true;
    const prevZoom = currentZoomRef.current;
    const curZoom = mapRef.current.getZoom();

    // if (prevZoom > curZoom) {
    //   setFocusedMarker(null);
    //   setFocusedCluster(null);
    // }

    setCurrentZoom(curZoom);

    mapsRef.current.event.addListenerOnce(mapRef.current, "idle", () => {
      zoomingRef.current = false;
      renderOverlays();
    });
  };

  const setZoomListener = useRef(false);
  useEffect(() => {
    if (!map || !maps) return;

    if (!directionsService || !directionsRenderer) {
      const _directionsService = new maps.DirectionsService();
      const _directionsRenderer = new maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: "#4169E1",
          strokeOpacity: 1,
          strokeWeight: 8,
        },
      });
      setDirectionsService(_directionsService);
      setDirectionsRenderer(_directionsRenderer);
    }

    if (!setZoomListener.current) {
      map.addListener("zoom_changed", onZoom);
      setZoomListener.current = true;
    }
  }, [map, maps]);

  const focusedMarkerRef = React.useRef(null);

  function toggleClusterOverlay(active, cluster) {
    if (!cluster || !clusterOverlaysRef.current || !("marker" in cluster))
      return;

    const overlayToShow =
      clusterOverlaysRef.current[getMarkerOverlayKey(cluster, true)];

    if (overlayToShow === undefined || (active && !mapRef.current)) return;

    overlayToShow.changePane(
      active && "marker" in cluster && cluster["marker"]["hovered"]
        ? "floatPane"
        : "overlayLayer"
    );

    overlayToShow.setMap(active ? mapRef.current : null); // Show the overlay associated with the marker
  }

  function renderOverlays() {
    if (
      !markerClusterRef.current ||
      !overlaysRef.current ||
      !clusterOverlaysRef.current ||
      !markersRef.current ||
      !mapRef.current
    )
      return;

    const zoom = mapRef.current.getZoom();

    // Find all markers that are in clusters
    const clusteredMarkers = [];

    markerClusterRef.current.clusters.forEach((cluster) => {
      if (
        // (!focusedClusterRef.current && cluster.markers?.length > 1) ||
        // (focusedClusterRef.current !== null &&
        //   focusedClusterRef.current.marker !== cluster.marker &&
        //   cluster.markers?.length > 1)
        true
      ) {
        cluster.markers?.forEach((marker) => {
          toggleOverlay(false, marker);

          clusteredMarkers.push(getMarkerOverlayKey(marker));
        });

        if (zoom < OVERLAYS_ALWAYS_VISIBLE_ZOOM_LEVEL) {
          toggleClusterOverlay(false, cluster);
        } else if (
          zoom >= OVERLAYS_ALWAYS_VISIBLE_ZOOM_LEVEL &&
          !focusedMarkerRef.current
        ) {
          toggleClusterOverlay(true, cluster);
        }
      } else {
        toggleClusterOverlay(false, cluster);
      }
    });

    if (
      markerClusterRef.current.clusters.length > 0 &&
      Object.values(clusterOverlaysRef.current).some((x) => x.map !== null)
    ) {
      const orphanedClusterOverlays = Object.keys(
        clusterOverlaysRef.current
      ).filter(
        (x) =>
          !markerClusterRef.current.clusters.some(
            (c) => getMarkerOverlayKey(c, true) === x
          )
      );

      for (const key of orphanedClusterOverlays) {
        clusterOverlaysRef.current[key].setMap(null);
        clusterOverlaysRef.current[key] = null;
        delete clusterOverlaysRef.current[key];
      }
    }

    // Hide overlays for clustered markers, show for others
    for (const marker of markersRef.current) {
      if (!focusedMarkerRef.current) {
        if (
          !focusedClusterRef.current ||
          focusedClusterRef.current.markers.indexOf(marker) === -1
        )
          toggleOverlay(false, marker);
      }
      //  if (clusteredMarkers.indexOf(getMarkerOverlayKey(marker)) === -1)
      else {
        toggleOverlay(
          marker["hovered"] || marker === focusedMarkerRef.current,
          marker
        );
      }
    }

    markersRef.current.forEach((m) => {
      if (m.hovered) {
        toggleOverlay(true, m);
      }
    });

    markerClusterRef.current.clusters.forEach((c) => {
      if (c.marker.hovered) {
        toggleClusterOverlay(true, c);
      }
    });
  }

  function toggleOverlay(active, marker) {
    const overlayToShow = overlaysRef.current[getMarkerOverlayKey(marker)];

    if (overlayToShow === undefined || (active && !mapRef.current)) return;

    overlayToShow.changePane(
      active && (marker["hovered"] || marker === focusedMarkerRef.current)
        ? "floatPane"
        : "overlayLayer"
    );

    overlayToShow.setMap(active ? mapRef.current : null); // Show the overlay associated with the marker
  }

  const markerHoveredRef = React.useRef(false);
  const markerHoveredOverlayRef = React.useRef(null);

  const onMarkerMouseOver = (marker, index) => {
    // console.log("marker mouse over: " + marker.info);

    markerHoveredRef.current = true;
    marker["hovered"] = true;

    if (zoomingRef.current) return;

    renderOverlays();
  };

  const onMarkerMouseOut = (marker, index) => {
    marker["hovered"] = false;
    markerHoveredRef.current = false;

    if (zoomingRef.current) return;

    renderOverlays();
  };

  const [focusedMarker, setFocusedMarker] = useState(null);

  useEffect(() => {
    focusedMarkerRef.current = focusedMarker;

    if (focusedMarker) {
      var position = focusedMarker.getPosition();

      var bounds = new mapsRef.current.LatLngBounds();

      //extend the bounds to include each marker's position
      bounds.extend(position);

      // markers.forEach((m) => {
      //   toggleOverlay(true, m);
      // });

      mapRef.current.fitBounds(bounds);
    }

    // Set the map's center to the marker's position
    // mapRef.current.setZoom(15);
    // offsetCenter(position, 0, 70);
    // console.log("focused marker:", focusedMarker?.info);
    renderOverlays();
  }, [focusedMarker]);

  const onMarkerClick = (marker) => {
    // Get the marker's position
    if (!mapRef.current) return;

    setFocusedCluster(null);
    setFocusedMarker(marker);

    // var position = marker.getPosition();

    // var bounds = new mapsRef.current.LatLngBounds();

    // //extend the bounds to include each marker's position
    // bounds.extend(position);

    // // markers.forEach((m) => {
    // //   toggleOverlay(true, m);
    // // });

    // mapRef.current.fitBounds(bounds);

    // // Set the map's center to the marker's position
    // // mapRef.current.setZoom(15);
    // // offsetCenter(position, 0, 70);
  };

  function offsetCenter(latlng, offsetx, offsety) {
    if (!mapsRef.current || !mapRef.current) return;

    // latlng is the LatLng of the marker's position
    // offsetx is the horizontal pixel offset
    // offsety is the vertical pixel offset
    // map is the Google Maps map instance

    var scale = Math.pow(2, mapRef.current.getZoom());
    var nw = new mapsRef.current.LatLng(
      mapRef.current.getBounds().getNorthEast().lat(),
      mapRef.current.getBounds().getSouthWest().lng()
    );

    var worldCoordinateCenter = mapRef.current
      .getProjection()
      .fromLatLngToPoint(latlng);
    var pixelOffset = new mapsRef.current.Point(
      offsetx / scale || 0,
      offsety / scale || 0
    );

    var worldCoordinateNewCenter = new mapsRef.current.Point(
      worldCoordinateCenter.x - pixelOffset.x,
      worldCoordinateCenter.y + pixelOffset.y
    );

    var newCenter = mapRef.current
      .getProjection()
      .fromPointToLatLng(worldCoordinateNewCenter);

    mapRef.current.setCenter(newCenter);
  }

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

  function createMarker({ label, maps, map, position, title, icon, priority }) {
    const marker = new maps.Marker({
      label,
      map,
      position: new maps.LatLng(position.lat, position.lng),
      title,
      icon,
    });
    marker["priority"] = priority;

    return marker;
  }

  const clusterOverlaysRef = React.useRef({});

  const [focusedCluster, setFocusedCluster] = useState(null);
  const focusedClusterRef = React.useRef(null);

  useEffect(() => {
    focusedClusterRef.current = focusedCluster;

    if (focusedCluster) {
      var bounds = new maps.LatLngBounds();

      //extend the bounds to include each marker's position
      for (const marker of focusedCluster.markers)
        bounds.extend(marker.position);

      // markers.forEach((m) => {
      //   toggleOverlay(true, m);
      // });

      map.fitBounds(bounds);
    }

    renderOverlays();
  }, [focusedCluster]);

  useEffect(() => {
    if (markers.length === 0 || maps === undefined) return;

    if (markerClusterRef.current) {
      markerClusterRef.current.clearMarkers();
    }

    const markerCluster = new MarkerClusterer({
      markers,
      map,
      renderer: {
        render: (ok, stats, map) => {
          const { count, markers, _position } = ok;
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

          const m = createMarker({
            maps,
            map,
            position: { lat: _position.lat(), lng: _position.lng() },
            icon: important
              ? {
                  url: ICON_KEYS[important.iconKey].url,
                  scaledSize: new maps.Size(
                    ICON_KEYS[important.iconKey].scaledSize[0],
                    ICON_KEYS[important.iconKey].scaledSize[1]
                  ),
                }
              : closestMarker.icon,
          });

          m["info"] = important
            ? important.info + " and " + (count - 1) + " more"
            : count + " markers";
          m.addListener("mouseover", () => {
            // onMarkerMouseOver(m, markers.indexOf(m));
            m["hovered"] = true;
            if (zoomingRef.current) return;

            markerHoveredRef.current = true;

            markersRef.current.forEach((m) => {
              if (markers.indexOf(m) !== -1) return;

              toggleOverlay(false, m);
            });

            if (markerClusterRef.current) {
              markerClusterRef.current.clusters.forEach((c) => {
                if (c.markers.length > 1) {
                  toggleClusterOverlay(false, c);
                }
              });
            }

            if (
              clusterOverlaysRef.current[
                getMarkerOverlayKey({ marker: m, markers: markers }, true)
              ]
            ) {
              toggleClusterOverlay(true, {
                marker: m,
                markers: markers,
              });

              markerHoveredOverlayRef.current =
                clusterOverlaysRef.current[
                  getMarkerOverlayKey({ marker: m, markers: markers }, true)
                ];
            }
          });

          m.addListener("mouseout", () => {
            // onMarkerMouseOut(m, markers.indexOf(m));
            m["hovered"] = false;
            if (zoomingRef.current) return;

            markerHoveredRef.current = false;
            markerHoveredOverlayRef.current = null;
            renderOverlays();
          });

          m.addListener("click", () => {
            // onMarkerClick(m);
            setFocusedMarker(null);
            setFocusedCluster({ marker: m, markers: markers });
            // var bounds = new maps.LatLngBounds();

            // //extend the bounds to include each marker's position
            // for (const marker of markers) bounds.extend(marker.position);

            // // markers.forEach((m) => {
            // //   toggleOverlay(true, m);
            // // });

            // map.fitBounds(bounds);
          });

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
              offsetY: important ? ICON_KEYS[important.iconKey].offsetY : 20,
            });

            overlay.setMap(null);
            clusterOverlaysRef.current[
              getMarkerOverlayKey({ marker: m, markers: markers }, true)
            ] = overlay;
          }

          markers.forEach((m) => (m["hovered"] = false));

          return m;
        },
      },
    });

    // maps.event.removeListener(markerCluster, "clusteringbegin");
    // maps.event.addListener(markerCluster, "clusteringbegin", () => {

    // });

    // maps.event.removeListener(markerCluster, "clusteringend");
    maps.event.addListener(markerCluster, "clusteringend", () => {
      // console.log("cluster end");
      renderOverlays();
    });

    setMarkerCluster(markerCluster);
  }, [maps, markers]);

  const onGoogleApiLoaded = ({ map, maps }) => {
    // const data = JSON.parse(JSON.stringify(testData));

    setMaps(maps);
    setMap(map);
    setCurrentZoom(map.getZoom());
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

  const [timelineHidden, setTimelineHidden] = useState(false);
  const [routing, setRouting] = useState(false);
  const [routingData, setRoutingData] = useState([]);

  useEffect(() => {
    if (!routing) {
      setRoutingData([]);
    } else {
      setRoutingData([
        timelineActivities[0],
        timelineActivities[timelineActivities.length - 1],
      ]);
    }
  }, [routing]);

  useEffect(() => {
    if (!directionsService || !directionsRenderer) return;

    if (routingData.length === 0) {
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

  const [filtersOpen, setFiltersOpen] = useState(false);

  if (!fetchedAPIKey) return null;

  return (
    <React.Fragment>
      <AppHeader
        markers={renderedMarkers}
        noLocationItems={noLocationItems}
        allCities={allCities}
        markerDays={markerDays}
        allTags={allTags}
        focusedMarker={focusedMarker}
        focusedCluster={focusedCluster}
        onSearch={(search) => {
          setFocusedMarker(null);
          setFocusedCluster(null);

          if (search === "") {
            setMarkerInfoFilter(null);
          } else {
            setMarkerInfoFilter(search);
          }
        }}
        onFilterEdit={(filters) => {
          setMarkerPropertyFilters(filters);
        }}
        onFiltersOpen={(open) => {
          setTimelineHidden(open);
          setFiltersOpen(open);
        }}
      />
      <GoogleMapReact
        options={createOptions}
        bootstrapURLKeys={{
          key: fetchedAPIKey,
          language: "en",
          region: "US",
          libraries: ["places", "routes", "geometry"],
        }}
        defaultCenter={defaultProps.center}
        defaultZoom={defaultProps.zoom}
        yesIWantToUseGoogleMapApiInternals
        onGoogleApiLoaded={onGoogleApiLoaded}
        // layerTypes={["TransitLayer"]}
      />
      {/* Timeline */}
      {currentDayFilter !== null &&
        currentDayFilter !== "All" &&
        currentDayFilter !== "General" &&
        timelineActivities.length > 0 && (
          <>
            <div
              style={{
                position: "fixed",
                bottom: "50%",
                transform: !timelineHidden
                  ? "translateX(0) translateY(50%)"
                  : "translateX(calc(100% + 20px)) translateY(50%)",
                right: 0,
                zIndex: 99999,
                background: "rgba(255,255,255,.75)",
                borderRadius: "1em 0 0 1em",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                transition: "transform 0.3s ease-in-out",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: filtersOpen ? 0 : timelineHidden ? -55 : 0,
                  padding: "10px",
                  cursor: filtersOpen ? "default" : "pointer",
                  borderRadius: "1em",
                  border: timelineHidden ? "1px solid black" : "none",
                  backgroundColor: timelineHidden
                    ? "rgba(255,255,255,1)"
                    : "rgba(0,0,0,0)",
                  display: "flex",
                  alignContent: "center",
                  alignItems: "center",
                  justifyContent: "center",
                  justifyItems: "center",
                  transition: "all .7s ease",
                }}
                onClick={() => {
                  if (filtersOpen) return;

                  setTimelineHidden(!timelineHidden);
                }}
              >
                {timelineHidden ? (
                  <ArrowBackIosIcon />
                ) : (
                  <ArrowForwardIosIcon />
                )}
              </div>
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
                onClick={() => {
                  setRouting(!routing);
                }}
              >
                {routing ? <CancelIcon /> : <ForkLeftIcon />}
              </div>
              <h2
                style={{
                  fontFamily: "'Indie Flower', cursive",
                  paddingTop: "16px",
                  paddingLeft: "16px",
                  marginTop: "32px",
                  marginBottom: "0px",
                }}
              >
                Day {currentDayFilter}
              </h2>
              {routing && (
                <h3
                  style={{
                    fontFamily: "'Indie Flower', cursive",
                    paddingLeft: "32px",
                    marginTop: "0px",
                  }}
                >
                  Routing
                </h3>
              )}
              <Timeline
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
                    onMarkerClick(activity.marker);
                  }
                }}
              />
            </div>
          </>
        )}
      {/* <POIDetailsCard
        active={focusedMarker !== null || focusedCluster !== null}
        title={
          focusedCluster === null && focusedMarker === null
            ? ""
            : focusedMarker
            ? focusedMarker.info
            : focusedCluster.markers.map((m) => m.info)
        }
        day={
          focusedCluster === null && focusedMarker === null
            ? null
            : focusedMarker
            ? focusedMarker.day
            : null
        }
        date={
          focusedCluster === null && focusedMarker === null
            ? null
            : focusedMarker
            ? focusedMarker.date
            : null
        }
        description={
          focusedCluster === null && focusedMarker === null
            ? ""
            : focusedMarker
            ? focusedMarker.description
            : ""
        }
        tags={
          focusedCluster === null && focusedMarker === null
            ? []
            : focusedMarker
            ? focusedMarker.tags
            : []
        }
        onClose={() => {
          setFocusedMarker(null);
          setFocusedCluster(null);

          if (mapRef.current) mapRef.current.setZoom(13);
        }}
      /> */}
      <AppFooter
        currentMapStyle={currentMapStyle}
        currentRenderType={currentRenderType}
        setCurrentMapStyle={setCurrentMapStyle}
        setCurrentRenderType={setCurrentRenderType}
        focusedCluster={focusedCluster}
        focusedMarker={focusedMarker}
        onDrawerClose={() => {
          setFocusedMarker(null);
          setFocusedCluster(null);

          if (mapRef.current) mapRef.current.setZoom(13);
        }}
        setFocusedMarker={setFocusedMarker}
      />
    </React.Fragment>
  );
};

export default MapView;
