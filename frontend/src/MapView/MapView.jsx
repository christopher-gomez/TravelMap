import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import GoogleMapReact from "google-map-react";
// import testData from "./MapTestData.json";
import mapStyles from "./MapStyles.json";
// Import the .webp icon
import TokyoTowerIcon from "../Assets/tokyo-tower-icon-alpha.png";
import HiltonIcon from "../Assets/hilton-tokyo-bay-icon.png";
import TempleIcon from "../Assets/senso-ji-temple.png";
// import CustomMarker from "./CustomMarker";
import { MarkerClusterer } from "@googlemaps/markerclusterer";

import "./OverlayStyles.css";
import { queryDatabase, updatePage } from "../Api/Notion";
import { TOKYO_QUERY } from "./NotionMapQueryParams";
import { getGoogleMapsApiKey } from "../Api/Maps";

const ICON_KEYS = {
  temple: {
    url: TempleIcon,
    scaledSize: [50, 50],
    offsetY: -7,
  },
  tokyoTower: {
    url: TokyoTowerIcon,
    scaledSize: [80, 80],
    offsetY: -2,
  },
};

// import {
//   findLocationLngLat,
//   updateLocationProperties,
// } from "./UpdateLocationProperties";
// import fetchNotionPage from "../util/api";

// import PlacesData from "./data.json";

const OVERRIDE_ICONS = {
  "Tokyo Tower": { url: TokyoTowerIcon, scaledSize: [80, 80], offsetY: -2 },
  "Hilton Tokyo Bay": { url: HiltonIcon, scaledSize: [70, 70], offsetY: -12 },
  "Senso-ji Temple": { url: TempleIcon, scaledSize: [70, 70], offsetY: -7 },
};

const OVERLAYS_ALWAYS_VISIBLE_ZOOM_LEVEL = 14;

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
        isImportant: item.title in OVERRIDE_ICONS,
      });
      marker["info"] = item.title;
      markers.push(marker);

      const overlay = createOverlay({
        maps,
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

  useEffect(() => {
    if (itineraryData !== null && map !== undefined && maps !== undefined) {
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
    if (!map || !maps || transRef.current !== null) return;

    // transRef.current =
    // new maps.TransitLayer();
    // transRef.current.setMap(map);
    // new maps.BicyclingLayer().setMap(map);
    // new maps.TrafficLayer().setMap(map);
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
    zoomingRef.current = true;
    const prevZoom = currentZoomRef.current;

    setCurrentZoom(map.getZoom());

    maps.event.addListenerOnce(map, "idle", () => {
      zoomingRef.current = false;
      if (
        focusedMarkerExitOverlayRef.current &&
        prevZoom > currentZoomRef.current
      ) {
        setFocusedMarker(null);
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

  useEffect(() => {
    if (!map || !maps) return;

    maps.event.clearListeners(map, "zoom_changed");
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

    if (focusedMarkerRef.current) {
    }
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

    if (zoom < OVERLAYS_ALWAYS_VISIBLE_ZOOM_LEVEL) {
      if (focusedMarkerExitOverlayRef.current) {
        focusedMarkerExitOverlayRef.current.setMap(null);
        focusedMarkerExitOverlayRef.current = null;
      }
    }

    // markersRef.current.forEach((m) => m.setVisible(true));

    // Find all markers that are in clusters
    const clusteredMarkers = [];
    markerClusterRef.current.clusters.forEach((cluster) => {
      if (cluster.markers?.length > 1) {
        cluster.markers?.forEach((marker) => {
          if (
            overlaysRef.current[getMarkerOverlayKey(marker)] &&
            overlaysRef.current[getMarkerOverlayKey(marker)].map !== null
          ) {
            overlaysRef.current[getMarkerOverlayKey(marker)].setMap(null);
          }

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
      if (zoom < OVERLAYS_ALWAYS_VISIBLE_ZOOM_LEVEL) {
        if (
          overlaysRef.current[getMarkerOverlayKey(marker)] &&
          overlaysRef.current[getMarkerOverlayKey(marker)].map !== null
        )
          overlaysRef.current[getMarkerOverlayKey(marker)].setMap(null); // Marker is clustered, hide the overlay
      } else if (
        overlaysRef.current[getMarkerOverlayKey(marker)] &&
        overlaysRef.current[getMarkerOverlayKey(marker)].map === null &&
        clusteredMarkers.indexOf(getMarkerOverlayKey(marker)) === -1
      ) {
        overlaysRef.current[getMarkerOverlayKey(marker)].setMap(mapRef.current); // Marker is not clustered, show the overlay
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

    if (focusedMarkerRef.current) {
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

    if (focusedMarkerExitOverlayRef.current) {
      focusedMarkerExitOverlayRef.current.setMap(null);
      focusedMarkerExitOverlayRef.current = null;
    }

    toggleOverlay(false, marker);
  };

  const [focusedMarker, setFocusedMarker] = useState(null);
  const focusedMarkerInfoOverlayRef = React.useRef(null);

  useEffect(() => {
    focusedMarkerRef.current = focusedMarker;

    if (focusedMarkerInfoOverlayRef.current) {
      focusedMarkerInfoOverlayRef.current.setMap(null);
      focusedMarkerInfoOverlayRef.current = null;
    }

    if (focusedMarkerExitOverlayRef.current) {
      focusedMarkerExitOverlayRef.current.setMap(null);
      focusedMarkerExitOverlayRef.current = null;
    }

    if (focusedMarker) {
      // focusedMarkerInfoOverlayRef.current = createOverlay({
      //   maps: mapsRef.current,
      //   marker: focusedMarker,
      //   map: mapRef.current,
      //   title:
      //     "A lot of info about this location goes here. It's a very important location. It's the best location. SDoifrenfnopaeindfvoinrefoiadnfnv dasiovnasdoinvf faoijasoidjfas[doijf[asodijf asdf[iojasfoij adfoidsjfpasoidfjasdoifj asdfijjsadfoijasdfopijasdfpoijasdpfoi asdfpiojsadopfijaspdoijf afdsiojasfdpoij]]]",
      //   offsetY: -25,
      //   offsetX: -150,
      //   type: "info",
      // });

      focusedMarkerExitOverlayRef.current = createOverlay({
        maps: mapsRef.current,
        marker: focusedMarker,
        map: mapRef.current,
        title: "X",
        offsetY: -75,
        offsetX: 50,
        type: "icon",
        onClick: () => {
          setFocusedMarker(null);
        },
      });
    }
  }, [focusedMarker]);

  const onMarkerClick = (marker) => {
    // Get the marker's position
    var position = marker.getPosition();

    if (!mapRef.current) return;

    setFocusedMarker(marker);
    focusedMarkerRef.current = focusedMarker;

    // Set the map's center to the marker's position
    mapRef.current.setCenter(position);
    mapRef.current.setZoom(17);
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
    maps,
    map,
    marker,
    title,
    position,
    offsetY,
    offsetX,
    type,
    onClick,
  }) {
    let className = "LocationTitleWindow";

    if (type === "info") {
      className = "LocationInfoWindow";
    }

    if (type === "icon") {
      className = "LocationIconWindow";
    }

    class CustomOverlay extends maps.OverlayView {
      constructor(map, location, Component, props) {
        super();
        this.map = map;
        this.location = location;
        this.Component = Component;
        this.props = props; // Initial props
        this.div = null;
        this.currentPaneType = "overlayLayer";
        this.setMap(map);
      }

      onAdd() {
        var div = document.createElement("div");
        // Style your div however you wish
        div.className = className;

        // Insert the content
        div.innerHTML = this.content;

        // Assign the div as a property of the overlay
        this.div = div;

        // You can append your div to the "overlayLayer" pane or "floatPane" to have it
        // float above the map and markers.
        var panes = this.getPanes();

        // console.log(panes);

        if (onClick === undefined) {
          if (!(this.currentPaneType in panes))
            this.currentPaneType = "overlayLayer";
          panes[this.currentPaneType].appendChild(div);
        } else {
          this.currentPaneType = "overlayMouseTarget";
          panes[this.currentPaneType].appendChild(div);
          div.addEventListener("click", () => {
            onClick();
          });
        }

        this.renderComponent();
      }

      changePane(paneName) {
        this.currentPaneType = paneName;
      }

      renderComponent() {
        // Render the React component into the div with the current props
        ReactDOM.render(<this.Component {...this.props} />, this.div, () =>
          this.draw()
        );
      }

      draw() {
        // Access the div from the property
        var div = this.div;

        const projection = overlay.getProjection();
        const pixel = projection.fromLatLngToDivPixel(_position);

        offsetY = offsetY ?? 5;

        if (div) {
          offsetX = offsetX ?? div.clientWidth / 2; // Center the div over the marker

          div.style.left = pixel.x - offsetX + "px";
          div.style.top = pixel.y + offsetY + "px";

          div.style.zIndex = 99999; // Ensure the overlay is always on top
        }
      }

      onRemove() {
        ReactDOM.unmountComponentAtNode(this.div);
        // Remove the div from the map when the overlay is removed
        if (this.div) {
          this.div.parentNode.removeChild(this.div);
          this.div = null;
        }
      }

      updateProps(newProps) {
        // Update the props and rerender the component
        this.props = { ...this.props, ...newProps };
        this.renderComponent();
      }
    }

    let pos = position ?? marker.position;
    const _position =
      typeof pos.lat === "function" && typeof pos.lng === "function"
        ? { lat: pos.lat(), lng: pos.lng() }
        : pos;

    const _title = title ?? marker.title;

    const MyComponent = (props) => <div>{props.text}</div>;

    const overlay = new CustomOverlay(null, _position, MyComponent, {
      text: _title,
    });

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
    isImportant,
    priority,
  }) {
    const marker = new maps.Marker({
      label,
      map,
      position: new maps.LatLng(position.lat, position.lng),
      title,
      icon,
    });

    if (isImportant) {
      marker["isImportant"] = true;
      marker["priority"] = 0;
    }

    if (priority !== undefined && priority !== null) {
      marker["isImportant"] = true;
      marker["priority"] = priority;
    }

    return marker;
  }

  const clusterOverlaysRef = React.useRef({});

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
          const hasImportantMarker = markers.some(
            (marker) => marker["isImportant"]
          );

          // Choose the icon based on whether the cluster contains an important marker
          const important = markers.find((m) => m["isImportant"]);

          const m = createMarker({
            maps,
            map,
            position: hasImportantMarker
              ? {
                  lat: important.position.lat(),
                  lng: important.position.lng(),
                }
              : { lat: _position.lat(), lng: _position.lng() },
            icon: hasImportantMarker
              ? {
                  url: OVERRIDE_ICONS[important.info].url,
                  scaledSize: new maps.Size(
                    OVERRIDE_ICONS[important.info].scaledSize[0],
                    OVERRIDE_ICONS[important.info].scaledSize[1]
                  ),
                }
              : null,
          });

          // clusterMarkerPins.current[key] = m;
          m["info"] = hasImportantMarker
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

          if (
            !(
              getMarkerOverlayKey({ marker: m, markers: markers }, true) in
              clusterOverlaysRef.current
            )
          ) {
            const overlay = createOverlay({
              maps,
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
            top: 0,
            left: 0,
            display: "flex",
            flexFlow: "column",
            alignItems: "start",
            backgroundColor: "rgb(0, 0, 0, .5)",
            backgroundFilter: "blur(10px)",
            padding: "0 1.5em .5em 1em",
            zIndex: 99999,
            borderRadius: "0 0 25px 0",
          }}
        >
          <h2 style={{ margin: "15px 0 0" }}>Itinerary Map</h2>
          <p>Current Zoom Level: {currentZoom}</p>
          <p>
            OVERLAYS_ALWAYS_VISIBLE_ZOOM_LEVEL:{" "}
            {OVERLAYS_ALWAYS_VISIBLE_ZOOM_LEVEL}
          </p>
          {/* <button>Traffic Layer</button>
          <p>Zoom: {currentZoom}</p> */}
        </div>
      </div>
    </div>
  );
};

export default MapView;
