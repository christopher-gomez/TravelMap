import React, { useEffect, useRef, useState } from "react";
import GoogleMapReact from "google-map-react";
// import testData from "./MapTestData.json";
import mapStyles from "./MapStyles.json";
// Import the .webp icon
import TokyoTowerIcon from "../Assets/tokyo-tower-icon-alpha.png";
import HiltonIcon from "../Assets/hilton-tokyo-bay-icon.png";
import TempleIcon from "../Assets/senso-ji-temple.png";
import RamenIcon from "../Assets/ramen.png";
import SushiIcon from "../Assets/sushi.png";
import JiroIcon from "../Assets/jiro.png";
import SkytreeIcon from "../Assets/skytree.png";

// import CustomMarker from "./CustomMarker";
import { MarkerClusterer } from "@googlemaps/markerclusterer";

import { queryDatabase, updatePage } from "../Api/Notion";
import { TOKYO_QUERY } from "./NotionMapQueryParams";
import { getGoogleMapsApiKey } from "../Api/Maps";
import CustomOverlayContainerFactory from "./POI/CustomOverlayContainerClass";
import POILabel from "./POI/POILabel";
import ICON_KEYS from "./POI/IconMapKeys";
import POIDetails from "./POI/POIDetails";

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

    const fetchItineraryData = async () => {
      const query = await queryDatabase(TOKYO_QUERY);
      if (query.results && query.results.length > 0) {
        setItineraryData(query.results);
        console.log(query.results);

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
    const styles = JSON.parse(JSON.stringify(mapStyles));
    return {
      fullscreenControl: false,
      // mapId: "1491931a2040a345",
      styles: styles,
    };
  };

  const [map, setMap] = useState(undefined);
  const mapRef = React.useRef(map);
  const [maps, setMaps] = useState(undefined);
  const mapsRef = React.useRef(maps);

  function parseItineraryDataLocations(data) {
    const places = [];
    data.forEach((item) => {
      if (
        item.properties.Location.rich_text.length === 0 ||
        item.properties.Location.rich_text[0].plain_text === ""
      ) {
        return;
      }

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
        });
      }
    });

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
          item.icon !== null && item.icon in ICON_KEYS
            ? {
                url: ICON_KEYS[item.icon].url,
                scaledSize: new maps.Size(
                  ICON_KEYS[item.icon].scaledSize[0],
                  ICON_KEYS[item.icon].scaledSize[1]
                ),
              }
            : null,
        priority: item.priority,
      });

      if (item.icon && item.icon in ICON_KEYS) marker["iconKey"] = item.icon;

      marker["info"] = item.title;
      marker["description"] = item.description;
      marker["tags"] = item.tags;
      markers.push(marker);

      const overlay = createOverlay({
        marker: item,
        type: "title",
        offsetY:
          item.icon !== null && item.icon in ICON_KEYS
            ? ICON_KEYS[item.icon].offsetY
            : 5,
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

    markersRef.current.forEach((m, i) => m.setVisible(true));
  }

  useEffect(() => {
    mapRef.current = map;

    if (map) {
      map.addListener("dragend", onPan);
    }
  }, [map]);

  useEffect(() => {
    mapsRef.current = maps;
  }, [maps]);

  const transRef = React.useRef(null);

  useEffect(() => {
    if (!map || !maps) return;

    // transRef.current =
    // new maps.TransitLayer();
    // transRef.current.setMap(map);
    // new maps.BicyclingLayer().setMap(map);
    // new maps.TrafficLayer().setMap(map);

    // console.log(maps.MapTypeId)
    // map.setMapTypeId(maps.MapTypeId.ROADMAP);
  }, [map, maps]);

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

    markersRef.current = markers;
  }, [markers]);

  useEffect(() => {
    overlaysRef.current = overlays;
  }, [overlays]);

  useEffect(() => {
    if (!currentZoom) return;

    const prevZoom = currentZoomRef.current;
    currentZoomRef.current = currentZoom;

    if (prevZoom > currentZoom) renderOverlays();
  }, [currentZoom]);

  const zoomingRef = React.useRef(false);

  const onZoom = () => {
    console.log("on Zoom");
    zoomingRef.current = true;
    const prevZoom = currentZoomRef.current;

    setCurrentZoom(mapRef.current.getZoom());

    mapsRef.current.event.addListenerOnce(mapRef.current, "idle", () => {
      zoomingRef.current = false;
      if (prevZoom > currentZoomRef.current) {
        setFocusedMarker(null);
        setFocusedCluster(null);
      }

      if (
        markerHoveredRef.current &&
        (prevZoom > currentZoomRef.current ||
          currentZoomRef.current >= OVERLAYS_ALWAYS_VISIBLE_ZOOM_LEVEL)
      ) {
        markersRef.current.forEach((m) => m.setVisible(true));
      }

      if (prevZoom > currentZoomRef.current) renderOverlays();
    });
  };

  const setZoomListener = useRef(false);
  useEffect(() => {
    if (!map || !maps || setZoomListener.current) return;

    setZoomListener.current = true;
    // maps.event.clearListeners(map, "zoom_changed");
    map.addListener("zoom_changed", onZoom);
  }, [map, maps]);

  // useEffect(() => {
  //   if (!map || !markers || !overlays || !markerCluster) return;

  //   mapRef.current = map;
  //   markersRef.current = markers;
  //   overlaysRef.current = overlays;
  //   markerClusterRef.current = markerCluster;

  //   // renderOverlays();
  // }, [map, markers, overlays, markerCluster, ]);

  const focusedMarkerExitOverlayRef = React.useRef(null);
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

    if (!focusedMarkerRef.current) {
      if (focusedMarkerExitOverlayRef.current) {
        focusedMarkerExitOverlayRef.current.setMap(null);
        focusedMarkerExitOverlayRef.current = null;
      }
    }

    // markersRef.current.forEach((m) => m.setVisible(true));

    // Find all markers that are in clusters
    const clusteredMarkers = [];

    markerClusterRef.current.clusters.forEach((cluster) => {
      if (
        (!focusedClusterRef.current && cluster.markers?.length > 1) ||
        (focusedClusterRef.current !== null &&
          focusedClusterRef.current.marker !== cluster.marker &&
          cluster.markers?.length > 1)
      ) {
        cluster.markers?.forEach((marker) => {
          toggleOverlay(false, marker);

          clusteredMarkers.push(getMarkerOverlayKey(marker));
        });

        if (zoom < OVERLAYS_ALWAYS_VISIBLE_ZOOM_LEVEL) {
          toggleClusterOverlay(false, cluster);
        } else if (zoom >= OVERLAYS_ALWAYS_VISIBLE_ZOOM_LEVEL) {
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

    // console.log("orphanedClusterOverlays");
    // console.log(orphanedClusterOverlays);

    // Hide overlays for clustered markers, show for others
    for (const marker of markersRef.current) {
      if (
        !focusedMarkerRef.current &&
        zoom < OVERLAYS_ALWAYS_VISIBLE_ZOOM_LEVEL
      ) {
        if (
          !focusedClusterRef.current ||
          focusedClusterRef.current.markers.indexOf(marker) === -1
        )
          toggleOverlay(false, marker);
      } else if (
        !focusedMarkerRef.current &&
        clusteredMarkers.indexOf(getMarkerOverlayKey(marker)) === -1
      ) {
        toggleOverlay(true, marker);
      }
    }

    if (markersRef.current.every((m) => !m.visible)) {
      markersRef.current.forEach((m) => m.setVisible(true));
    }
  }

  function toggleOverlay(active, marker) {
    // console.log("toggleOverlay active: " + active + " marker: " + marker.info);
    const overlayToShow = overlaysRef.current[getMarkerOverlayKey(marker)];

    if (overlayToShow === undefined || (active && !mapRef.current)) return;

    overlayToShow.changePane(
      active && marker["hovered"] ? "floatPane" : "overlayLayer"
    );

    overlayToShow.setMap(active ? mapRef.current : null); // Show the overlay associated with the marker

    if (focusedMarkerExitOverlayRef.current) {
      focusedMarkerExitOverlayRef.current.setMap(
        active ? mapRef.current : null
      );
    }
  }

  const markerHoveredRef = React.useRef(false);
  const markerHoveredOverlayRef = React.useRef(null);

  const onMarkerMouseOver = (marker, index) => {
    // console.log("marker mouse over: " + marker.info);

    markerHoveredRef.current = true;
    marker["hovered"] = true;

    if (zoomingRef.current) return;

    markerHoveredOverlayRef.current =
      overlaysRef.current[getMarkerOverlayKey(marker)];

    markersRef.current.forEach((m, i) => {
      if (i !== index) {
        // if (currentZoomRef.current < OVERLAYS_ALWAYS_VISIBLE_ZOOM_LEVEL) {
        //   m.setVisible(false);
        // }

        if (
          !focusedClusterRef.current ||
          focusedClusterRef.current.markers.indexOf(m) === -1
        )
          toggleOverlay(false, m);
      }
    });

    markerClusterRef.current.clusters.forEach((c) => {
      if (c.markers.length > 1) toggleClusterOverlay(false, c);
    });

    toggleOverlay(true, marker);
  };

  const onMarkerMouseOut = (marker, index) => {
    // console.log("marker mouse out: " + marker.info);
    marker["hovered"] = false;
    markerHoveredRef.current = false;

    if (zoomingRef.current) return;

    if (
      focusedMarkerRef.current === marker &&
      currentZoomRef.current < OVERLAYS_ALWAYS_VISIBLE_ZOOM_LEVEL
    ) {
      toggleOverlay(true, marker);
    } else {
      markersRef.current.forEach((m, i) => m.setVisible(true));
      markerClusterRef.current.clusters.forEach((c) => {
        c.marker.setVisible(true);
      });
    }

    if (currentZoomRef.current >= OVERLAYS_ALWAYS_VISIBLE_ZOOM_LEVEL) {
      const clusteredMarkers = markerClusterRef.current.clusters
        .filter((c) => c.markers.length > 1)
        .map((c) => {
          return c.markers.map((marker) => {
            // code for each marker in c
            return marker;
          });
        })
        .flat();

      // console.log(clusteredMarkers);

      markersRef.current.forEach((m, i) => {
        if (m.visible && clusteredMarkers.indexOf(m) === -1)
          toggleOverlay(true, m);
      });
      markerClusterRef.current.clusters.forEach((c) => {
        if (c.markers.length > 1) {
          toggleClusterOverlay(true, c);
        }
      });
      // setFocusedMarker(null);
      // focusedMarkerRef.current = null;
      return;
    }

    // if (focusedMarkerRef.current === marker) {
    //   setFocusedMarker(null);
    //   return;
    // }

    if (!focusedMarkerRef.current || focusedMarkerRef.current !== marker) {
      // if (focusedMarkerExitOverlayRef.current) {
      //   focusedMarkerExitOverlayRef.current.setMap(null);
      //   focusedMarkerExitOverlayRef.current = null;
      // }

      if (
        !focusedClusterRef.current ||
        focusedClusterRef.current.markers.indexOf(marker) === -1
      )
        toggleOverlay(false, marker);
      else if (focusedClusterRef.current.markers.indexOf(marker) !== -1)
        toggleOverlay(true, marker);
    }
  };

  const [focusedMarker, setFocusedMarker] = useState(null);
  // const focusedMarkerInfoOverlayRef = React.useRef(null);

  useEffect(() => {
    if (focusedMarkerExitOverlayRef.current) {
      focusedMarkerExitOverlayRef.current.setMap(null);
      focusedMarkerExitOverlayRef.current = null;
    }

    if (focusedMarker) {
      focusedMarkerExitOverlayRef.current = createOverlay({
        marker: focusedMarker,
        map: mapRef.current,
        title: "X",
        offsetY: -75,
        offsetX: 50,
        type: "icon",
        onClick: () => {
          setFocusedMarker(null);

          if (mapRef.current) mapRef.current.setZoom(13);
        },
      });
    } else if (focusedMarkerRef.current) {
      toggleOverlay(false, focusedMarkerRef.current);
    }

    focusedMarkerRef.current = focusedMarker;
  }, [focusedMarker]);

  const onMarkerClick = (marker) => {
    // Get the marker's position
    if (!mapRef.current) return;

    var position = marker.getPosition();

    setFocusedCluster(null);
    setFocusedMarker(marker);

    // Set the map's center to the marker's position
    mapRef.current.setCenter(position);

    mapRef.current.setZoom(20);
  };

  useEffect(() => {
    if (
      markers.length == 0 ||
      Object.entries(overlays).length == 0 ||
      maps === undefined
    )
      return;

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
  }, [markers, overlays, maps]);

  function populateInfoWindow(
    div,
    headerData,
    title,
    contentBodyData,
    otherData
  ) {
    // Clear the current content
    div.innerHTML = "";

    // Create the header div and set its content
    let headerDiv = document.createElement("div");
    headerDiv.id = "header";
    headerDiv.textContent = headerData;

    // Create the title element
    let titleElement = document.createElement("h1");
    titleElement.textContent = title;

    // Create the content body div
    let contentDiv = document.createElement("div");
    contentDiv.id = "LocationContent";
    contentDiv.textContent = contentBodyData;

    // Create the other things div
    let otherDiv = document.createElement("div");
    otherDiv.id = "otherThings";
    otherDiv.textContent = otherData;

    // Append all our elements to the main div
    div.appendChild(headerDiv);
    div.appendChild(titleElement);
    div.appendChild(contentDiv);
    div.appendChild(otherDiv);

    // Now you can add any CSS classes to div for animation
    div.classList.add("animate-info-window");
  }

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

    // const MyComponent = (props) => <div>{props.text}</div>;

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
  }, [focusedCluster]);

  useEffect(() => {
    if (markers.length === 0 || maps === undefined) return;

    if (markerClusterRef.current) {
      markerClusterRef.current.clearMarkers();
    }

    const markerCluster = new MarkerClusterer({
      markers /*: markers.filter(m => !m['isImportant'])*/,
      map,
      renderer: {
        render: (ok, stats, map) => {
          const { count, markers, _position } = ok;

          // Check if any markers are marked as important
          // const hasImportantMarker = markers.some(
          //   (marker) => marker["isImportant"]
          // );

          // Choose the icon based on whether the cluster contains an important marker

          let important;
          let valids = markers.filter((m) => m.iconKey !== undefined);

          if (valids.length > 0)
            important = valids.reduce((prev, curr) => {
              return curr.priority >= prev.priority ? curr : prev;
            });

          // const important = markers.find((m) => m["isImportant"]);

          if (important)
            console.log(
              "Important marker: " +
                important.info +
                " priority: " +
                important.priority
            );

          const m = createMarker({
            maps,
            map,
            position: { lat: _position.lat(), lng: _position.lng() },
            //  important
              // ? {
              //     lat: important.position.lat(),
              //     lng: important.position.lng(),
              //   }
              // : { lat: _position.lat(), lng: _position.lng() },
            icon: important
              ? {
                  url: ICON_KEYS[important.iconKey].url,
                  scaledSize: new maps.Size(
                    ICON_KEYS[important.iconKey].scaledSize[0],
                    ICON_KEYS[important.iconKey].scaledSize[1]
                  ),
                }
              : null,
          });

          // clusterMarkerPins.current[key] = m;
          m["info"] = important
            ? important.info + " and " + (count - 1) + " more"
            : count + " markers";
          m.addListener("mouseover", () => {
            m["hovered"] = true;
            if (zoomingRef.current) return;

            markerHoveredRef.current = true;

            markersRef.current.forEach((m) => {
              if (markers.indexOf(m) !== -1) return;

              // if (currentZoomRef.current < OVERLAYS_ALWAYS_VISIBLE_ZOOM_LEVEL)
              //   m.setVisible(false);

              toggleOverlay(false, m);
            });

            if (markerClusterRef.current) {
              markerClusterRef.current.clusters.forEach((c) => {
                if (c.markers.length > 1) {
                  // c.marker.setVisible(false);
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
            m["hovered"] = false;
            if (zoomingRef.current) return;

            markerHoveredRef.current = false;
            markerHoveredOverlayRef.current = null;
            markersRef.current.forEach((m) => {
              if (!m.visible) m.setVisible(true);
            });

            markerClusterRef.current.clusters.forEach((c) => {
              if (!c.marker.visible) c.marker.setVisible(true);
            });

            renderOverlays();
          });

          m.addListener("click", () => {
            console.log("clusterclick");
            setFocusedCluster({ marker: m, markers: markers });
            var bounds = new maps.LatLngBounds();

            //extend the bounds to include each marker's position
            for (const marker of markers) bounds.extend(marker.position);

            // if you want to still keep the default behaviour, keep the line below

            markers.forEach((m) => {
              toggleOverlay(true, m);
            });

            map.fitBounds(bounds);
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
            });

            overlay.setMap(null);
            clusterOverlaysRef.current[
              getMarkerOverlayKey({ marker: m, markers: markers }, true)
            ] = overlay;
          }

          return m;
        },
      },
    });

    // maps.event.removeListener(markerCluster, "clusteringbegin");
    // maps.event.addListener(markerCluster, "clusteringbegin", () => {

    // });

    // maps.event.removeListener(markerCluster, "clusteringend");
    maps.event.addListener(markerCluster, "clusteringend", () => {
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

  if (!fetchedAPIKey) return null;

  return (
    <div style={{ height: "100vh", width: "100%", position: "absolute" }}>
      <GoogleMapReact
        options={createOptions}
        bootstrapURLKeys={{
          key: fetchedAPIKey,
          language: "en",
          region: "US",
          libraries: ["places"],
        }}
        defaultCenter={defaultProps.center}
        defaultZoom={defaultProps.zoom}
        yesIWantToUseGoogleMapApiInternals
        onGoogleApiLoaded={onGoogleApiLoaded}
        // layerTypes={["TransitLayer"]}
      />
      <div>
        <div
          style={{
            position: "fixed",
            top:
              focusedMarker === null && focusedCluster === null ? 0 : "-100%",
            left: 0,
            display: "flex",
            flexFlow: "column",
            alignItems: "start",
            backgroundColor: "rgb(0, 0, 0, .5)",
            backgroundFilter: "blur(10px)",
            padding: "0 1.5em .5em 1em",
            zIndex: 99999,
            borderRadius: "0 0 25px 0",
            transition: "top 1s ease",
          }}
        >
          <h2 style={{ margin: "15px 0 0" }}>Itinerary Map</h2>
          {/* <button>Traffic Layer</button>
          <p>Zoom: {currentZoom}</p> */}
        </div>
        <POIDetails
          active={focusedMarker !== null || focusedCluster !== null}
          title={
            focusedCluster === null && focusedMarker === null
              ? ""
              : focusedMarker
              ? focusedMarker.info
              : focusedCluster.markers.map((m) => m.info)
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
        />
      </div>
    </div>
  );
};

export default MapView;
