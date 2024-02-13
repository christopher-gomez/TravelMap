import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import GoogleMapReact from "google-map-react";
import testData from "./MapTestData.json";
import mapStyles from "./MapStyles.json";
// Import the .webp icon
import TokyoTowerIcon from "../Assets/tokyo-tower-icon-alpha.png";
import HiltonIcon from "../Assets/hilton-tokyo-bay-icon.png";
import SensojiIcon from "../Assets/senso-ji-temple.png";
// import CustomMarker from "./CustomMarker";
import { MarkerClusterer } from "@googlemaps/markerclusterer";

import "./OverlayStyles.css";
// import fetchNotionPage from "../util/api";

// const NOTION_API_KEY = ;
const OVERRIDE_ICONS = {
  "Tokyo Tower": { url: TokyoTowerIcon, scaledSize: [80, 80], offsetY: -2 },
  "Hilton Tokyo Bay": { url: HiltonIcon, scaledSize: [70, 70], offsetY: -12 },
  "Senso-ji Temple": { url: SensojiIcon, scaledSize: [70, 70], offsetY: -7 },
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

  useEffect(() => {
    const fetchAPIKey = async () => {
      setFetchingKey(true);
      const response = await fetch("/maps/api");
      const data = await response.json();

      setFetchingKey(false);
      setFetchedAPIKey(data.key);
    };

    if (!fetchedAPIKey && !fetchingKey) fetchAPIKey();

    // Initializing a client
    // const notion = new Client({
    //   auth: process.env.NOTION_TOKEN,
    // });

    // (async () => {
    //   // const listUsersResponse = await notion.users.list({});
    //   // console.log(listUsersResponse);
    //   // const ok = await notion.pages.retrieve({page_id: "Japan-0084898a74cb4919b29622de944d1fbb"});
    //   // console.log(ok);
    //   // const data = await fetchNotionPage("Japan-0084898a74cb4919b29622de944d1fbb");
    //   // console.log(data);
    // })()
  }, []);

  const createOptions = (maps) => {
    const styles = JSON.parse(JSON.stringify(mapStyles));
    // console.log(styles);
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

  // useEffect(() => {
  //   console.log(JSON.parse(JSON.stringify(mapStyles)));
  // }, []);

  function onPan() {
    console.log("onPan");

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
    markersRef.current = markers;
  }, [markers]);

  useEffect(() => {
    overlaysRef.current = overlays;
  }, [overlays]);

  useEffect(() => {
    if (!currentZoom) return;

    // console.log("setting current zoom: " + currentZoom);

    currentZoomRef.current = currentZoom;
    renderOverlays();
  }, [currentZoom]);

  const zoomingRef = React.useRef(false);

  const onZoom = () => {
    // markerHoveredRef.current = false;
    zoomingRef.current = true;
    const prevZoom = currentZoomRef.current;

    // if (markerHoveredRef.current) {
    //   markersRef.current.forEach((m) => m.setVisible(true));
    // }

    setCurrentZoom(map.getZoom());
    // setFocusedMarker(null);
    // focusedMarkerRef.current = null;

    maps.event.addListenerOnce(map, "idle", () => {
      zoomingRef.current = false;
      if (
        focusedMarkerExitOverlayRef.current &&
        prevZoom > currentZoomRef.current
      ) {
        setFocusedMarker(null);
      }

      if (markerHoveredRef.current && prevZoom > currentZoomRef.current) {
        markersRef.current.forEach((m) => m.setVisible(true));
      }

      if (
        markerHoveredRef.current &&
        currentZoomRef.current >= OVERLAYS_ALWAYS_VISIBLE_ZOOM_LEVEL
      ) {
        markersRef.current.forEach((m) => m.setVisible(true));
      }

      // if (!markerHoveredRef.current)
      //   markersRef.current.forEach((m) => m.setVisible(true));

      renderOverlays();

      // if (markerHoveredRef.current && markerHoveredOverlayRef.current && ) {
      //   if (markerHoveredOverlayRef.current.map == null)
      //     markerHoveredOverlayRef.current.setMap(mapRef.current);
      // }
    });
  };

  useEffect(() => {
    if (!map || !maps) return;

    renderOverlays();
    map.addListener("zoom_changed", onZoom);
  }, [map, maps]);

  useEffect(() => {
    if (!map || !markers || !overlays || !markerCluster) return;

    renderOverlays();
  }, [map, markers, overlays, markerCluster]);

  const focusedMarkerExitOverlayRef = React.useRef(null);
  const focusedMarkerRef = React.useRef(null);

  function renderOverlays() {
    if (!markerCluster || !overlays || !markers || !map) return;

    const clusters = markerCluster.clusters;
    const clusteredMarkers = [];

    const zoom = map.getZoom();

    markersRef.current.forEach((m) => m.setVisible(true));

    // Find all markers that are in clusters
    clusters.forEach((cluster) => {
      if (cluster.markers?.length > 1)
        cluster.markers?.forEach((marker) => {
          clusteredMarkers.push(marker);
        });
    });

    for (const m in clusterOverlaysRef.current) {
      if (
        m in clusterOverlaysRef.current &&
        clusterOverlaysRef.current[m] !== null
      ) {
        clusterOverlaysRef.current[m].setMap(null);
        clusterOverlaysRef.current[m] = null;
        delete clusterOverlaysRef.current[m];
      }
    }

    // Hide overlays for clustered markers, show for others
    for (const marker of markers) {
      if (
        clusteredMarkers.find((m) => m.info === marker.info) ||
        zoom < OVERLAYS_ALWAYS_VISIBLE_ZOOM_LEVEL
      ) {
        if (focusedMarkerExitOverlayRef.current) {
          focusedMarkerExitOverlayRef.current.setMap(null);
          focusedMarkerExitOverlayRef.current = null;
        }

        // if (
        //   !clusteredMarkers.find((m) => m.info === marker.info) &&
        //   !markerHoveredRef.current
        // )
        overlays[marker.info].setMap(null); // Marker is clustered, hide the overlay
      } else {
        if (overlays[marker.info].map === null && !markerHoveredRef.current)
          overlays[marker.info].setMap(map); // Marker is not clustered, show the overlay
      }

      if (markersRef.current.every((m) => !m.visible)) {
        markersRef.current.forEach((m) => m.setVisible(true));
      }
    }
  }

  function toggleOverlay(active, marker) {
    // console.log("toggleOverlay active: " + active + " marker: " + marker.info);
    const overlayToShow = overlaysRef.current[marker.info];

    if (overlayToShow === undefined || (active && !mapRef.current)) return;

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
    markerHoveredRef.current = true;

    if (zoomingRef.current) return;

    markerHoveredOverlayRef.current = overlaysRef.current[marker.info];
    markersRef.current.forEach((m, i) => {
      if (i !== index) {
        if (currentZoomRef.current < OVERLAYS_ALWAYS_VISIBLE_ZOOM_LEVEL)
          m.setVisible(false);

        toggleOverlay(false, m);
      }
    });

    toggleOverlay(true, marker);
  };

  const onMarkerMouseOut = (marker, index) => {
    markerHoveredRef.current = false;

    if (zoomingRef.current) return;

    // console.log("onMarkerMouseOut");
    if (
      focusedMarkerRef.current === marker &&
      currentZoomRef.current < OVERLAYS_ALWAYS_VISIBLE_ZOOM_LEVEL
    ) {
      toggleOverlay(true, marker);
    } else {
      markersRef.current.forEach((m, i) => m.setVisible(true));
    }

    if (currentZoomRef.current >= OVERLAYS_ALWAYS_VISIBLE_ZOOM_LEVEL) {
      markersRef.current.forEach((m, i) => toggleOverlay(true, m));
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
    if (markers.length == 0 || Object.entries(overlays).length == 0) return;

    markers.forEach((marker, index) => {
      // Add a mouseover event listener to the marker
      marker.addListener("mouseover", () => onMarkerMouseOver(marker, index));

      // Add a mouseout event listener to hide the overlay when the mouse leaves the marker
      marker.addListener("mouseout", () => onMarkerMouseOut(marker, index));

      marker.addListener("click", () => onMarkerClick(marker));
    });
  }, [markers, overlays]);

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

  function createOverlayDiv(_title, className) {
    let div = document.createElement("div");
    div.className = className;

    // div.textContent = _title; // The text you want to display

    div.style.zIndex = 1;

    return div;
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
        this.setMap(map);
      }

      onAdd() {
        // console.log(
        //   "Overlay onAdd: " + _title + " " + _position.lat + " " + _position.lng
        // );

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

        if (onClick === undefined) panes.overlayLayer.appendChild(div);
        else {
          panes.overlayMouseTarget.appendChild(div);
          div.addEventListener("click", () => {
            onClick();
          });
        }

        this.renderComponent();
      }

      renderComponent() {
        // Render the React component into the div with the current props
        ReactDOM.render(<this.Component {...this.props} />, this.div);
      }

      draw() {
        // Access the div from the property
        var div = this.div;

        // console.log(
        //   "Overlay draw: " + _title + " " + _position.lat + " " + _position.lng
        // );
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

    // function CustomOverlay(map, location, content) {
    //   this.map = map;
    //   this.location = location;
    //   this.content = content;
    //   this.div = null; // This will hold the DOM element

    //   // Explicitly call setMap on this overlay
    //   this.setMap(map);
    // }

    // CustomOverlay.prototype = new maps.OverlayView();

    // CustomOverlay.prototype.onAdd = function () {
    //   // console.log(
    //   //   "Overlay onAdd: " + _title + " " + _position.lat + " " + _position.lng
    //   // );

    //   var div = document.createElement("div");
    //   // Style your div however you wish
    //   div.className = className;

    //   // Insert the content
    //   div.innerHTML = this.content;

    //   // Assign the div as a property of the overlay
    //   this.div = div;

    //   // You can append your div to the "overlayLayer" pane or "floatPane" to have it
    //   // float above the map and markers.
    //   var panes = this.getPanes();

    //   if (onClick === undefined) panes.overlayLayer.appendChild(div);
    //   else {
    //     panes.overlayMouseTarget.appendChild(div);
    //     div.addEventListener("click", () => {
    //       onClick();
    //     });
    //   }
    // };

    // CustomOverlay.prototype.draw = function () {};

    // CustomOverlay.prototype.onRemove = function () {
    //   // Remove the div from the map when the overlay is removed
    //   if (this.div) {
    //     this.div.parentNode.removeChild(this.div);
    //     this.div = null;
    //   }
    // };

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

  const [clusterOverlays, setClusterOverlays] = useState({});
  const clusterOverlaysRef = React.useRef(clusterOverlays);
  useEffect(() => {
    clusterOverlaysRef.current = clusterOverlays;
  }, [clusterOverlays]);

  const onGoogleApiLoaded = ({ map, maps }) => {
    const data = JSON.parse(JSON.stringify(testData));

    const markers = [];
    const overlays = {};
    let index = 0;
    for (const item of data) {
      const marker = createMarker({
        maps,
        map,
        position: item.position,
        icon:
          item.title in OVERRIDE_ICONS
            ? {
                url: OVERRIDE_ICONS[item.title].url,
                scaledSize: new maps.Size(
                  OVERRIDE_ICONS[item.title].scaledSize[0],
                  OVERRIDE_ICONS[item.title].scaledSize[1]
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
          item.title in OVERRIDE_ICONS ? OVERRIDE_ICONS[item.title].offsetY : 5,
      });

      // populateInfoWindow(infoDiv, "Header Info", "Title", "This is the main content body.", "Other relevant information.");

      overlays[item.title] = overlay;
      index++;
    }

    setMaps(maps);
    setMap(map);
    setCurrentZoom(map.getZoom());
    setMarkers(markers);
    setOverlays(overlays);

    setMarkerCluster(
      new MarkerClusterer({
        markers /*: markers.filter(m => !m['isImportant'])*/,
        map,
        renderer: {
          render: (ok) => {
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

            m["info"] = hasImportantMarker
              ? important.info + " and " + (count - 1) + " more"
              : count + " markers";

            m.addListener("mouseover", () => {
              if (zoomingRef.current) return;

              markerHoveredRef.current = true;

              markersRef.current.forEach((m) => m.setVisible(false));

              if (markerClusterRef.current) {
                // console.log("looping through clusters " + m.info);
                // console.log("has markers: ");
                // console.log(markers);
                markerClusterRef.current.clusters.forEach((c) => {
                  if (c.markers.length > 1) {
                    // console.log(
                    //   "found cluster greater than 1 :" + c.markers.length
                    // );
                    // console.log(c.markers);
                    if (
                      !c.markers.some((_m) =>
                        markers.some((__m) => __m.info === _m.info)
                      )
                    ) {
                      // console.log("setting cluster marker to visbile false");
                      // console.log(c);
                      c.marker.setVisible(false);
                      // c.markers.forEach((m) => m.setVisible(false));
                    }
                  }
                });
              }

              if (clusterOverlaysRef.current[m.info]) {
                clusterOverlaysRef.current[m.info].setMap(map);
                return;
              }

              const overlay = createOverlay({
                maps,
                marker: m,
                type: "title",
                title: m.info,
              });

              overlay.setMap(map);
              clusterOverlaysRef.current[m.info] = overlay;
              markerHoveredOverlayRef.current = overlay;
            });

            m.addListener("mouseout", () => {
              if (zoomingRef.current) return;

              markerHoveredRef.current = false;

              markerClusterRef.current.clusters.forEach((c) => {
                c.marker.setVisible(true);
              });

              if (clusterOverlaysRef.current[m.info]) {
                clusterOverlaysRef.current[m.info].setMap(null);
              }

              clusterOverlaysRef.current[m.info] = null;
            });

            return m;
          },
        },
      })
    );
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
            right: 0,
            display: "flex",
            flexFlow: "row",
            alignContent: "flex-end",
          }}
        >
          {/* <button>Traffic Layer</button>
          <p>Zoom: {currentZoom}</p> */}
        </div>
      </div>
    </div>
  );
};

export default MapView;
