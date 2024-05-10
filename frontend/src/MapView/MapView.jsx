import React, { useEffect, useRef, useState } from "react";
import GoogleMapReact from "google-map-react";
import dayjs from "dayjs";
// import testData from "./MapTestData.json";
import TransitStyle from "./MapStyles/TransitStyle.json";
import DefaultStyle from "./MapStyles/DefaultStyle.json";

import { MarkerClusterer } from "@googlemaps/markerclusterer";

import { queryDatabase } from "../Api/Notion";
import { NOTION_QUERY } from "./NotionMapQueryParams";
import { getGoogleMapsApiKey } from "../Api/Maps";
import CustomOverlayContainerFactory from "./POI/CustomOverlayContainerClass";
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
} from "./UpdateLocationProperties";
import GoogleSignIn from "../Util/GoogleSignIn";
import ItineraryTimeline, {
  timeOrder,
  timeOverrideKeys,
} from "./ItineraryTimeline";
import {
  createCompositeIcon,
  createEmojiIcon,
  getUniqueCitiesFromMarkers,
} from "../Util/Utils";
import { Typography } from "@mui/material";
import MapDrawer from "./Footer/MapDrawer";

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

  useEffect(() => {
    const fetchAPIKey = async () => {
      if (fetchingKey) return;

      setFetchingKey(true);

      const key = await getGoogleMapsApiKey();

      setFetchedAPIKey(key);
      setFetchingKey(false);
    };

    async function fetchAllPages(startCursor) {
      let results = [];
      let hasMore = true;
      let cursor = startCursor;

      while (hasMore) {
        const response = await fetch(
          `https://api.notion.com/v1/databases/YOUR_DATABASE_ID/query`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer YOUR_INTEGRATION_TOKEN`,
              "Notion-Version": "2021-05-13",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              start_cursor: cursor,
            }),
          }
        );
        const data = await response.json();
        results = results.concat(data.results);
        hasMore = data.has_more;
        cursor = data.next_cursor; // Update cursor to the next cursor from response
      }

      return results;
    }

    const fetchItineraryData = async (startCursor) => {
      let results = [];
      let hasMore = true;
      let cursor = startCursor;

      // const query = await queryDatabase({ ...NOTION_QUERY, cursor: cursor });
      // if (query.results && query.results.length > 0) {
      //   console.log("Itinerary data fetched", query);
      //   setItineraryData(query.results);
      //   // console.log(query.results);
      // }

      while (hasMore) {
        const data = await queryDatabase({
          ...NOTION_QUERY,
          cursor: cursor,
        });

        // console.log("got data", data);
        results = results.concat(data.results);
        hasMore = data.has_more;
        cursor = data.next_cursor; // Update cursor to the next cursor from response
      }

      // console.log("fetch", results);

      setItineraryData(results);
    };

    if (!fetchedAPIKey) fetchAPIKey();

    if (!itineraryData) fetchItineraryData(null);
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
    // console.log("data", data);
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
        title: item.title,
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

      if (item.icon && item.icon in ICON_KEYS) marker["iconKey"] = item.icon;
      if (item.icon && item.icon.type === "emoji") marker["iconType"] = "emoji";

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

      // populateInfoWindow(infoDiv, "Header Info", "Title", "This is the main content body.", "Other relevant information.");
      // overlays[getMarkerOverlayKey(marker)] = overlay;
      marker["overlay"] = overlay;
      index++;
    }

    setMarkers(markers);
    // setOverlays(overlays);
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
        setFocusedMarker(null);
      }
    }

    if (focusedClusterRef.current && mapRef.current && mapsRef.current) {
      const mapBounds = mapRef.current.getBounds();

      let isClusterVisible = true;
      let totalMarkers = 0;
      for (const marker of focusedClusterRef.current.markers) {
        if (!mapBounds.contains(marker.getPosition())) {
          // console.log("disabling marker overlay onPan: ", marker.info);
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
    const times = [];

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
    // days.unshift("All");
    // days.push("General");
    days.push("Not Set");

    setMarkerDays(days);
    markersRef.current = markers;
  }, [markers]);

  const [currentDayFilter, setCurrentDayFilter] = useState(null);
  const [allTags, setAllTags] = useState([]);
  const [allTimes, setAllTimes] = useState([]);
  const [allCities, setAllCities] = useState([]);
  // const [cityFilter, setCityFilter] = useState("All");
  // const [includeTagsFilter, setIncludeTagsFilter] = useState([]);
  // const [excludeTagsFilter, setExcludeTagsFilter] = useState([]);
  const [suggestedMarkers, setSuggestedMarkers] = useState([]);
  const suggestedMarkersRef = React.useRef(suggestedMarkers);

  useEffect(() => {
    suggestedMarkersRef.current = suggestedMarkers;
  }, [suggestedMarkers]);

  const [markerPropertyFilters, setMarkerPropertyFilters] = useState([]);
  const markerPropertyFiltersRef = React.useRef(markerPropertyFilters);

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
    setFocusedCluster(null);
    setFocusedMarker(null);

    markerPropertyFiltersRef.current = markerPropertyFilters;
  }, [markerPropertyFilters]);

  useEffect(() => {
    // console.log("Current Day Filter");
    // console.log(currentDayFilter);
    setFocusedCluster(null);
    setFocusedMarker(null);

    if (
      currentDayFilter !== null &&
      currentDayFilter !== "All" &&
      currentDayFilter !== "Not Set" &&
      !timelineOpen
    ) {
      setTimelineOpen(true);
    }
  }, [currentDayFilter]);

  useEffect(() => {
    // setCurrentDayFilter("All");
    setMarkerPropertyFilters([]);
  }, [markerDays]);

  useEffect(() => {
    setSuggestedMarkers([]);
  }, [markerPropertyFilters, currentDayFilter]);

  useEffect(() => {
    if (!markers || !maps || !map) return;

    // setRouting(false);
    // console.log("focusedMarker: ", focusedMarker);
    // console.log("markerInfoFilter: ", markerInfoFilter);
    setRenderedMarkers([]);
    renderMarkers();
    renderOverlays();
  }, [markerPropertyFilters, markerInfoFilter, markers, suggestedMarkers]);

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
        m.overlay?.setMap(null);
        // console.log("found a places poi removing from map");
        m.setMap(null);
      }
    });

    markers.forEach((marker, index) => {
      // marker.setVisible(false);
      // marker.setMap(null);
      marker.setOptions({ opacity: 1.0 });
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

    // suggestedMarkers.forEach((marker) => {
    //   // const icon = marker.getIcon();
    //   // icon.opacity = 0.5;
    //   // marker.setIcon(icon);
    // });

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

    if (
      markerClusterRef.current
      //  &&
      // _markers !== markerClusterRef.current.markers
    ) {
      markerClusterRef.current.clearMarkers();
      markerClusterRef.current.addMarkers(_markers);
    }

    setRenderedMarkers(_markers);

    if (_markers.length > 0) {
      const boundMarkers = focusedMarker
        ? [focusedMarker]
        : markerInfoFilter
        ? _markers.filter((m) => {
            return m.info
              .toLowerCase()
              .includes(markerInfoFilter.toLowerCase());
          })
        : suggestedMarkers.length > 0
        ? suggestedMarkers
        : _markers;

      var bounds = new maps.LatLngBounds();

      // Extend the bounds to include each marker's position
      for (const marker of boundMarkers) {
        bounds.extend(marker.position);
      }

      if (firstRender.current) {
        map.fitBounds(bounds);
        firstRender.current = false;
      }

      if (boundMarkers.length === 1) {
        setFocusedMarker(boundMarkers[0]);
      }
      // else {
      function checkAndAdjustBounds() {
        let allVisible = boundMarkers.every((marker) =>
          map.getBounds().contains(marker.position)
        );
        if (
          !allVisible ||
          markerPropertyFilters.filter(
            (f) =>
              f.property === FILTER_PROPERTIES.day &&
              f.value.length === 1 &&
              f.value[0] !== "All"
          ).length > 0
        ) {
          map.fitBounds(bounds); // Adjust the viewport if any marker is outside the current view
        }
      }

      const boundsCenter = bounds.getCenter();
      const mapCenter = map.getCenter();

      if (!mapCenter.equals(boundsCenter)) {
        map.panTo(boundsCenter);

        const listener = maps.event.addListener(map, "idle", () => {
          checkAndAdjustBounds();
          maps.event.removeListener(listener);
        });
      } else {
        checkAndAdjustBounds();
      }
    }
    // }
  };

  const [renderedMarkers, setRenderedMarkers] = useState([]);
  const renderedMarkersRef = React.useRef(renderedMarkers);
  const [timelineActivities, setTimelineActivities] = useState([]);

  useEffect(() => {
    renderedMarkersRef.current = renderedMarkers;
    renderedMarkers.forEach((m) => {
      if (!focusedMarker) m.setOptions({ opacity: 1 });
      else if (m !== focusedMarker) {
        m.setOptions({ opacity: 0.5 });
      }
    });

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

    setTimelineActivities(activities);
  }, [renderedMarkers]);

  useEffect(() => {
    overlaysRef.current = overlays;
  }, [overlays]);

  // useEffect(() => {
  //   if (!currentZoom) return;

  //   currentZoomRef.current = currentZoom;

  //   renderOverlays();
  // }, [currentZoom]);

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
  const [placesService, setPlacesService] = useState(null);
  const placesServiceRef = useRef(null);

  const [directionsService, setDirectionsService] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);

  const [geocoderService, setGeocoderService] = useState(null);

  useEffect(() => {
    placesServiceRef.current = placesService;
  }, [placesService]);

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

    if (!placesService) {
      const _placesService = new maps.places.PlacesService(map);
      setPlacesService(_placesService);
    }

    if (!geocoderService) {
      const _geocoderService = new maps.Geocoder();
      setGeocoderService(_geocoderService);
    }

    if (!setZoomListener.current) {
      map.addListener("zoom_changed", onZoom);
      setZoomListener.current = true;
    }
  }, [map, maps]);

  const [uniqueCities, setUniqueCities] = useState([]);

  useEffect(() => {
    if (markers && markers.length > 0 && geocoderService) {
      (async () => {
        const cities = await getUniqueCitiesFromMarkers(
          markers,
          geocoderService
        );
        setUniqueCities(cities);
      })();
    }
  }, [markers, geocoderService]);

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

    // console.log("rendering overlays");

    // const zoom = mapRef.current.getZoom();

    // Find all markers that are in clusters
    const clusteredMarkers = [];

    markerClusterRef.current.clusters.forEach((cluster) => {
      cluster.markers?.forEach((marker) => {
        if (marker !== focusedMarkerRef.current && !marker.hovered) {
          // console.log(
          //   "disabling overlay for marker in cluster: ",
          //   marker.info
          // );
          // console.log("disabling overlay for marker in cluster: ", marker.info);
          toggleOverlay(false, marker);
        }
        clusteredMarkers.push(getMarkerOverlayKey(marker));
      });
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
    for (const marker of renderedMarkersRef.current) {
      if (!focusedMarkerRef.current) {
        if (
          (!focusedClusterRef.current ||
            focusedClusterRef.current.markers.indexOf(marker) === -1) &&
          !marker.hovered
        ) {
          // console.log("disabling overlay for marker: ", marker.info);
          toggleOverlay(false, marker);
        }
      }
      //  if (clusteredMarkers.indexOf(getMarkerOverlayKey(marker)) === -1)
      // else {
      //   toggleOverlay(
      //     marker["hovered"] || marker === focusedMarkerRef.current,
      //     marker
      //   );
      // }
    }

    let anyHovered = false;
    renderedMarkersRef.current.forEach((m) => {
      if (m.hovered) {
        // console.log("found a hovered marker: ", m.info);
        anyHovered = true;
        toggleOverlay(true, m);
      }
    });

    if (!anyHovered && focusedMarkerRef.current) {
      // console.log("none hovered and focused marker");
      // if (markerClusterRef.current.clusters.length > 0) {
      //   console.log("current clusters: ", markerClusterRef.current.clusters);
      // }

      toggleOverlay(true, focusedMarkerRef.current);
    } else if (
      anyHovered &&
      focusedMarkerRef.current &&
      !focusedMarkerRef.current.hovered
    ) {
      // console.log(
      //   "disabling focused marker overlay: ",
      //   focusedMarkerRef.current.info
      // );
      toggleOverlay(false, focusedMarkerRef.current);
    }

    markerClusterRef.current.clusters.forEach((c) => {
      if (c.marker.hovered) {
        // console.log("found a hovered cluster: ", c.marker.info);
        toggleClusterOverlay(true, c);
      } else {
        toggleClusterOverlay(false, c);
      }
    });
  }

  function toggleOverlay(active, marker) {
    const overlayToShow =
      marker.overlay; /*overlaysRef.current[getMarkerOverlayKey(marker)]*/

    // if (active) console.log("toggle overlay: ", marker.overlay);

    if (overlayToShow === undefined || (active && !mapRef.current)) return;

    if (active) {
      let foundInCluster = false;
      markerClusterRef.current.clusters?.forEach((c) => {
        if (foundInCluster) return;

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
          }
        });
      });

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
    )
      overlayToShow.setMap(active ? mapRef.current : null); // Show the overlay associated with the marker
  }

  const markerHoveredRef = React.useRef(false);
  const markerHoveredOverlayRef = React.useRef(null);

  const onMarkerMouseOver = (marker, index) => {
    // console.log("marker mouse over: " + marker.info);

    markerHoveredRef.current = true;
    marker["hovered"] = true;

    // console.log(marker);

    if (zoomingRef.current) return;

    renderOverlays();
  };

  const onMarkerMouseOut = (marker, index) => {
    // console.log("marker mouse out");
    marker["hovered"] = false;
    markerHoveredRef.current = false;

    if (zoomingRef.current) return;

    renderOverlays();
  };

  const [focusedMarker, setFocusedMarker] = useState(null);

  useEffect(() => {
    focusedMarkerRef.current = focusedMarker;

    // annoying hack
    if (focusedMarker) focusedMarker.hovered = false;

    // if (focusedMarker) {
    //   var position = focusedMarker.getPosition();

    //   var bounds = new mapsRef.current.LatLngBounds();

    //   //extend the bounds to include each marker's position
    //   bounds.extend(position);

    //   // markers.forEach((m) => {
    //   //   toggleOverlay(true, m);
    //   // });

    //   mapRef.current.fitBounds(bounds);
    // }

    // Set the map's center to the marker's position
    // mapRef.current.setZoom(15);
    // if (focusedMarker) {
    //   mapRef.current.panTo(focusedMarker.position);
    // }
    // offsetCenter(position, 0, 70);
    // console.log("focused marker:", focusedMarker?.info);

    renderOverlays();
    renderMarkers();
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

  function createMarker({
    label,
    maps,
    map,
    position,
    title,
    icon,
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

    if (getPlaceDetails) {
      placesServiceRef.current.findPlaceFromQuery(
        {
          query: altPlaceName ?? title,
          fields: ["place_id"],
        },
        function (results, status) {
          if (status === maps.places.PlacesServiceStatus.OK) {
            // Assuming the first result is the one we want
            // console.log("got id for " + title + ": " + results[0].place_id);
            marker["placeId"] = results[0].place_id;
            getPlacePhoto(results[0].place_id, marker);
          } else {
            console.error("could not get id for " + title);
            setMarkersWithoutPhotos([...markersWithoutPhotos, marker]);
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
      //       console.error("could not get id for " + title);
      //       setMarkersWithoutPhotos([...markersWithoutPhotos, marker]);
      //     }
      //   }
      // );
    }

    return marker;
  }

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

  function getPlacePhoto(placeId, marker) {
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
          // console.log(
          //   `got ${place.photos.length} photo(s) for ${marker["info"]}`
          // );
          marker["photo"] = place.photos.map((photo) =>
            photo.getUrl({
              maxWidth: 400,
              maxHeight: 400,
            })
          );
        } else {
          console.error("could not get photo for " + marker["info"]);
          setMarkersWithoutPhotos([...markersWithoutPhotos, marker]);
        }
      }
    );
  }

  const clusterOverlaysRef = React.useRef({});

  const [focusedCluster, setFocusedCluster] = useState(null);
  const focusedClusterRef = React.useRef(null);

  useEffect(() => {
    focusedClusterRef.current = focusedCluster;

    // if (focusedCluster) {
    //   var bounds = new maps.LatLngBounds();

    //   //extend the bounds to include each marker's position
    //   for (const marker of focusedCluster.markers)
    //     bounds.extend(marker.position);

    //   // markers.forEach((m) => {
    //   //   toggleOverlay(true, m);
    //   // });

    //   map.fitBounds(bounds);
    // }

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

          if (important) {
            if (ICON_KEYS[important.iconKey].notImportant) {
              important = null;
            }
          }

          if (
            markerPropertyFiltersRef.current.length > 0 &&
            markerPropertyFiltersRef.current.filter(
              (p) =>
                p.property === FILTER_PROPERTIES.day &&
                p.value.length === 1 &&
                p.value[0] !== "All"
            ).length > 0 &&
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
            icon:
              important && ICON_KEYS[important.iconKey]
                ? {
                    url: ICON_KEYS[important.iconKey].url,
                    scaledSize: new maps.Size(
                      ICON_KEYS[important.iconKey].scaledSize[0],
                      ICON_KEYS[important.iconKey].scaledSize[1]
                    ),
                  }
                : important
                ? important.icon
                : closestMarker
                ? closestMarker.icon
                : null,
          });

          if (
            focusedMarkerRef.current &&
            markers.indexOf(focusedMarkerRef.current) === -1
          ) {
            m.setOptions({ opacity: 0.5 });
          } else if (!focusedMarkerRef.current) {
            m.setOptions({ opacity: 1 });
          }

          m["info"] = important
            ? important.info + " and " + (count - 1) + " more"
            : count + " markers";
          m.addListener("mouseover", () => {
            // onMarkerMouseOver(m, markers.indexOf(m));
            m["hovered"] = true;
            for (const marker of markers) marker["clusterHovered"] = true;

            if (zoomingRef.current) return;

            if (
              focusedMarkerRef.current &&
              markers.indexOf(focusedMarkerRef.current) !== -1
            )
              return;

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
            for (const marker of markers) marker["clusterHovered"] = false;
            if (zoomingRef.current) return;

            markerHoveredRef.current = false;
            markerHoveredOverlayRef.current = null;
            toggleClusterOverlay(false, {
              marker: m,
              markers: markers,
            });
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

          if (markers.find((m) => m.clusterHovered)) m["hovered"] = true;

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

            overlay.setMap(null);
            clusterOverlaysRef.current[
              getMarkerOverlayKey({ marker: m, markers: markers }, true)
            ] = overlay;
          }

          markers.forEach((m) => (m["hovered"] = false));

          // const callback = (iconURL) => {
          //   m.setOptions({ icon: { url: iconURL } });
          // };
          // if (
          //   shouldStackClusterIcons.current &&
          //   markers.some((m) =>
          //     suggestedMarkersRef.current.find((s) => s.id === m.id)
          //   )
          // ) {
          //   createCompositeIcon(
          //     markers.map((m) => m.icon.url),
          //     callback
          //   );
          // }

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

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(true);

  if (!fetchedAPIKey) return null;

  return (
    <React.Fragment>
      <AppHeader
        setFocusedCluster={setFocusedCluster}
        setFocusedMarker={setFocusedMarker}
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
          // console.log("onSearch", search);
          setFocusedMarker(null);
          setFocusedCluster(null);

          if (search === "") {
            // console.log("setting marker info filter to null");
            setMarkerInfoFilter(null);
          } else {
            setMarkerInfoFilter(search);
            // setFocusedMarker(markers.find(m => m.info === search));
          }
        }}
        onFilterEdit={(filters) => {
          setMarkerPropertyFilters(filters);
        }}
        onFiltersOpen={(open) => {
          // setTimelineHidden(open);
          // setFiltersOpen(open);
        }}
      />
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
      />
      {/* Timeline */}
      {currentDayFilter !== null &&
        currentDayFilter !== "All" &&
        currentDayFilter !== "Not Set" && (
          <ItineraryTimeline
            timelineActivities={timelineActivities}
            directionsRenderer={directionsRenderer}
            directionsService={directionsService}
            mapsService={maps}
            map={map}
            currentDayFilter={currentDayFilter}
            allDays={markerDays}
            markerPropertyFilters={markerPropertyFilters}
            setMarkerPropertyFilters={setMarkerPropertyFilters}
            onActivityClick={onMarkerClick}
            onSetSuggested={setSuggestedMarkers}
            allMarkers={markers}
            onActivityMouseOver={onMarkerMouseOver}
            onActivityMouseOut={onMarkerMouseOut}
            open={timelineOpen}
            onSetOpen={setTimelineOpen}
            placesService={placesService}
            createOverlay={createOverlay}
            geocoderService={geocoderService}
          />
        )}
      {/* {uniqueCities.length > 0 && (
        <div
          style={{
            position: "absolute",
            display: "flex",
            flexFlow: "column",
            left: 0,
            bottom: 0,
            background: 'rgba(255,255,255,.75)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Typography>Trip to {uniqueCities.join(", ")}</Typography>
        </div>
      )} */}
      <MapDrawer
        focusedCluster={focusedCluster}
        focusedMarker={focusedMarker}
        setMapLocked={setMapLocked}
        mapLocked={mapLocked}
        allMarkers={markers}
        onDrawerClose={() => {
          setFocusedMarker(null);
          setFocusedCluster(null);

          if (mapRef.current) mapRef.current.setZoom(13);
        }}
        setFocusedMarker={setFocusedMarker}
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
        offsetCenter={offsetCenter}
        onNewActivity={(marker) => {
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
      />
      <AppFooter
        currentMapStyle={currentMapStyle}
        currentRenderType={currentRenderType}
        setCurrentMapStyle={setCurrentMapStyle}
        setCurrentRenderType={setCurrentRenderType}
        offsetCenter={offsetCenter}
        focusedCluster={focusedCluster}
        focusedMarker={focusedMarker}
        setMapLocked={setMapLocked}
        mapLocked={mapLocked}
        allMarkers={markers}
        onDrawerClose={() => {
          setFocusedMarker(null);
          setFocusedCluster(null);

          if (mapRef.current) mapRef.current.setZoom(13);
        }}
        setFocusedMarker={setFocusedMarker}
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
