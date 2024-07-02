import ReactDOM from "react-dom";
import "./OverlayStyles.css";
import { Logger, arraysEqual } from "../../Util/Utils";

export default class CustomOverlayContainerFactory {
  constructor(maps) {
    class CustomOverlay extends maps.OverlayView {
      constructor(
        map,
        { location, onClick, offsetY, offsetX, type },
        Component,
        componentProps
      ) {
        super();
        this.offsetY = offsetY;
        this.offsetX = offsetX;
        this.onClick = onClick;
        this.map = map;
        this.location = location;
        this.Component = Component;
        this.props = componentProps; // Initial props
        this.div = null;
        this.currentPaneType = "overlayLayer";

        // if (type !== undefined) {
        //     let className = "LocationTitleWindow";

        //     if (type === "info") {
        //         className = "LocationInfoWindow";
        //     }

        //     if (type === "icon") {
        //         className = "LocationIconWindow";
        //     }

        //     this.className = className;
        // }

        this.calculateComponentWidth();

        this.setMap(map);
      }

      calculateComponentWidth() {
        // Create a temporary hidden div
        const tempDiv = document.createElement("div");
        tempDiv.style.visibility = "hidden";
        tempDiv.style.position = "absolute";
        tempDiv.style.top = "-9999px";
        tempDiv.style.left = "-9999px";

        document.body.appendChild(tempDiv);

        // Render the React component into the temporary div
        ReactDOM.render(<this.Component {...this.props} />, tempDiv, () => {
          // Calculate the width of the rendered component
          this.componentWidth = tempDiv.children[0].clientWidth;
          this.componentHeight = tempDiv.children[0].clientHeight;

          // Clean up by unmounting the component and removing the temporary div
          ReactDOM.unmountComponentAtNode(tempDiv);
          document.body.removeChild(tempDiv);
        });
      }

      onAdd() {
        var div = document.createElement("div");
        // Style your div however you wish

        if (this.className !== undefined) div.className = this.className;
        else div.style.position = "absolute";

        // Assign the div as a property of the overlay
        this.div = div;
        this.div.style.userSelect = "none";

        // You can append your div to the "overlayLayer" pane or "floatPane" to have it
        // float above the map and markers.
        var panes = this.getPanes();

        // Logger.Log(panes);

        if (this.onClick === undefined) {
          if (!(this.currentPaneType in panes))
            this.currentPaneType = "overlayLayer";
          panes[this.currentPaneType].appendChild(div);
        } else {
          this.currentPaneType = "overlayMouseTarget";
          panes[this.currentPaneType].appendChild(div);
          div.addEventListener("click", () => {
            this.onClick();
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

        const projection = this.getProjection();
        const pixel = projection.fromLatLngToDivPixel(this.location);

        this.offsetY = this.offsetY ?? 5;

        if (div) {
          this.offsetX = this.offsetX ?? div.clientWidth / 2; // Center the div over the marker

          div.style.left = pixel.x - this.offsetX + "px";
          div.style.top = pixel.y + this.offsetY + "px";

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

      updateOffsetY(offsetY) {
        this.offsetY = offsetY;
        this.draw();
      }
    }

    this.class = CustomOverlay;
  }
}

export class CustomVignetteOverlayFactory {
  constructor(maps) {
    class VignetteOverlay extends maps.OverlayView {
      constructor(bounds, map, labelOverlay) {
        super();
        this.bounds = bounds;
        this.map = map;
        this.div = null;
        this.labelOverlay = labelOverlay;

        this.setMap(map);
      }

      onAdd() {
        const div = document.createElement("div");
        div.style.borderStyle = "none";
        div.style.borderWidth = "0px";
        div.style.position = "absolute";
        div.style.zIndex = 9999 + 1;
        // div.style.transition = "all 0.5s ease";

        div.id = "vignette-overlay";

        // Create the dark overlay covering the entire map
        const darkOverlay = document.createElement("div");
        darkOverlay.style.width = "100%";
        darkOverlay.style.height = "100%";
        darkOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
        darkOverlay.style.position = "absolute";
        darkOverlay.style.top = "0";
        darkOverlay.style.left = "0";
        darkOverlay.style.pointerEvents = "none";
        darkOverlay.style.backdropFilter = "blur(10px)";

        // Create the transparent window overlay
        const windowOverlay = document.createElement("div");
        windowOverlay.style.position = "absolute";
        windowOverlay.style.background = "transparent";
        windowOverlay.style.pointerEvents = "none";
        windowOverlay.style.borderRadius = "50%";
        windowOverlay.style.transition =
          "width 0.5s ease, height 0.5s ease, background 0.5s ease, box-shadow 0.5s ease";

        div.appendChild(darkOverlay);
        div.appendChild(windowOverlay);
        this.div = div;
        this.windowOverlay = windowOverlay;

        const panes = this.getPanes();
        panes.overlayLayer.appendChild(div);

        this.draw();
      }

      draw() {
        const overlayProjection = this.getProjection();
        let sw = overlayProjection.fromLatLngToDivPixel(
          this.bounds.getSouthWest()
        );
        let ne = overlayProjection.fromLatLngToDivPixel(
          this.bounds.getNorthEast()
        );

        let padding = 100; // Padding in pixels
        if (!this.labelOverlay) padding = 125;
        sw.x -= padding;
        sw.y += padding;
        ne.x += padding;
        ne.y -= padding;

        // Calculate the required width to fit the label overlay
        let requiredWidth = ne.x - sw.x;
        let requiredHeight = sw.y - ne.y;
        if (this.labelOverlay) {
          const labelWidth = this.labelOverlay.componentWidth;
          const labelHeight = this.labelOverlay.componentHeight;
          if (requiredWidth < labelWidth) {
            requiredWidth = labelWidth + padding;
          }
          if (requiredHeight < labelHeight) {
            requiredHeight = labelHeight + padding;
          }
        }
        // else {
        //   Logger.Log("No label overlay found");
        // }

        const requiredSize = Math.max(requiredWidth, requiredHeight);

        const windowOverlay = this.windowOverlay;
        const centerX = (sw.x + ne.x) / 2;
        const centerY = (sw.y + ne.y) / 2;

        windowOverlay.style.left = centerX - requiredSize / 2 + "px";
        windowOverlay.style.top = centerY - requiredSize / 2 + "px";
        windowOverlay.style.width = requiredSize + "px";
        windowOverlay.style.height = requiredSize + "px";
        // Use a radial gradient for feathered edges
        windowOverlay.style.background = `radial-gradient(circle, rgba(0,0,0,0) 50%, rgba(0,0,0,1) 100%)`;
        windowOverlay.style.boxShadow = `0 0 0 9999px rgba(0, 0, 0, 0.85)`;
      }

      onRemove() {
        Logger.Log("removing vignette overlay");
        if (this.div) {
          this.div.parentNode.removeChild(this.div);
          this.div = null;
        }
      }

      updateAndRedraw(bounds, labelOverlay, map) {
        this.bounds = bounds;
        this.labelOverlay = labelOverlay;

        if (!this.map) {
          this.map = map;
          this.setMap(map);
        } else this.draw();
      }
    }

    this.class = VignetteOverlay;
  }
}

/**
 * CustomInfoWindowFactory
 *
 * This factory creates a custom Overlay that extends google.maps.OverlayView.
 * Given markers, it creates a shaded overlay that covers the area of the markers.
 *  *
 * @export
 * @class CustomDistrictOverlayFactory
 * @typedef {CustomDistrictOverlayFactory}
 */
export class CustomDistrictOverlayFactory {
  constructor(maps) {
    class DistrictOverlay extends maps.OverlayView {
      constructor(markers, map) {
        Logger.Log("DistrictOverlay created");
        Logger.Log("Markers:", markers);
        super();
        this.directionsService = new maps.DirectionsService();
        this.routeCache = {}; // Initialize the route cache
        this.markers = markers;
        this.map = map;
        this.div = null;

        this.setMap(map);
      }

      onAdd() {
        const div = document.createElement("div");
        // div.style.borderStyle = "solid";
        // div.style.borderWidth = "2px";
        // div.style.borderColor = "blue";
        div.style.position = "absolute";
        div.style.zIndex = 9999;

        div.id = "district-overlay";

        // Create the shaded area overlay
        // const shadedOverlay = document.createElement("div");
        // shadedOverlay.style.width = "100%";
        // shadedOverlay.style.height = "100%";
        // shadedOverlay.style.backgroundColor = "rgba(0, 0, 255, 0.2)";
        // shadedOverlay.style.position = "absolute";
        // shadedOverlay.style.top = "0";
        // shadedOverlay.style.left = "0";
        // shadedOverlay.style.pointerEvents = "none";

        // div.appendChild(shadedOverlay);
        this.div = div;

        this.div.id = "district-overlay";

        const panes = this.getPanes();
        panes.mapPane.appendChild(div);

        this.draw();
      }

      async draw() {
        if (!this.div) return;

        Logger.BeginLog("DistrictOverlay.draw()");
        const overlayProjection = this.getProjection();
        Logger.Log("markers:", this.markers);

        let points = this.markers.map((marker) => {
          const latLng = marker.getPosition();
          return {
            type: "marker",
            point: window.turf.point([latLng.lng(), latLng.lat()]),
            city: marker.city,
          };
        });

        // Log the points for debugging
        Logger.Log("Points:", points);

        // Adjust the buffer sizes based on the zoom level
        const bufferSize = 1.75 / 1;
        const routeBufferSize = 1.05 / 1;

        // Buffer the marker points
        let bufferedPoints = points.map((point) =>
          window.turf.buffer(point.point, bufferSize, { units: "kilometers" })
        );

        // Get the route between markers only if their buffer areas do not touch and they are in the same city
        let routes = [];
        for (let i = 0; i < this.markers.length - 1; i++) {
          if (!arraysEqual(this.markers[i].city, this.markers[i + 1].city))
            continue;

          const start = this.markers[i].getPosition();
          const end = this.markers[i + 1].getPosition();
          const startBuffer = window.turf.buffer(
            window.turf.point([start.lng(), start.lat()]),
            bufferSize,
            { units: "kilometers" }
          );
          const endBuffer = window.turf.buffer(
            window.turf.point([end.lng(), end.lat()]),
            bufferSize,
            { units: "kilometers" }
          );

          if (!window.turf.booleanIntersects(startBuffer, endBuffer)) {
            const route = await this.getCachedRoute(start, end);
            let accumulatedDistance = 0;

            for (let j = 1; j < route.length; j++) {
              const prevLatLng = route[j - 1];
              const currentLatLng = route[j];
              const prevPoint = window.turf.point([
                prevLatLng.lng(),
                prevLatLng.lat(),
              ]);
              const currentPoint = window.turf.point([
                currentLatLng.lng(),
                currentLatLng.lat(),
              ]);

              const distance = window.turf.distance(prevPoint, currentPoint, {
                units: "kilometers",
              });
              accumulatedDistance += distance;

              if (accumulatedDistance >= routeBufferSize) {
                routes.push({ type: "route", point: currentPoint });
                accumulatedDistance = 0;
              }
            }
          }
        }

        let bufferedRoutes = routes.map((route) =>
          window.turf.buffer(route.point, routeBufferSize, { units: "kilometers" })
        );

        let routeUnion = bufferedRoutes[0];
        for (let i = 1; i < bufferedRoutes.length; i++) {
          routeUnion = window.turf.union(routeUnion, bufferedRoutes[i]);
        }

        if(routeUnion) {
          routeUnion = window.turf.simplify(routeUnion, { tolerance: 0.0075, highQuality: false });
        }

        // points = points.concat(routes);

        // Create a buffer around each point
        bufferedPoints = points.map((point) =>
          window.turf.buffer(
            point.point,
            point.type === "route" ? routeBufferSize : bufferSize,
            { units: "kilometers" }
          )
        );

        // Union the buffered points to create a single polygon
        let union = bufferedPoints[0];
        for (let i = 1; i < bufferedPoints.length; i++) {
          union = window.turf.union(union, bufferedPoints[i]);
        }

        union = window.turf.union(union, routeUnion);

        if (!union) {
          Logger.Error("Cannot create union of buffered points");
          Logger.EndLog();
          return;
        }

        Logger.Log("Union:", union);

        Logger.Trace();
        Logger.EndLog();

        // Handle both Polygon and MultiPolygon types
        let coordinates;
        if (union.geometry.type === "MultiPolygon") {
          // Flatten the coordinates of the MultiPolygon into a single array
          coordinates = union.geometry.coordinates.flat(2);
        } else {
          coordinates = union.geometry.coordinates[0];
        }

        // Transform the union coordinates to pixel positions
        const pixelPoints = coordinates.map((coord) => {
          const latLng1 = new maps.LatLng(coord[1], coord[0]);
          return overlayProjection.fromLatLngToDivPixel(latLng1);
        });

        // Calculate the bounds of the polygon
        const xs = pixelPoints.map((p) => p.x);
        const ys = pixelPoints.map((p) => p.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        // Draw the polygon
        const div = this.div;
        if (!div) return;

        div.style.left = `${minX}px`;
        div.style.top = `${minY}px`;
        div.style.width = `${maxX - minX}px`;
        div.style.height = `${maxY - minY}px`;

        let svg = div.querySelector("svg");
        let createNewSvg = false;
        const svgNS = "http://www.w3.org/2000/svg";
        if (!svg) {
          createNewSvg = true;
          svg = document.createElementNS(svgNS, "svg");
        }

        if (!svg) return;

        svg.setAttribute("width", `${maxX - minX}`);
        svg.setAttribute("height", `${maxY - minY}`);
        svg.style.position = "absolute";
        svg.style.top = "0";
        svg.style.left = "0";

        let polygon = svg.querySelector("polygon");

        if (!polygon || createNewSvg) {
          polygon = document.createElementNS(svgNS, "polygon");
        }

        if(!this.map) return;

        const pointsString = pixelPoints
          .map((p) => `${p.x - minX},${p.y - minY}`)
          .join(" ");
        polygon.setAttribute("points", pointsString);
        polygon.style.fill = "rgba(0, 0, 255, 0.2)";
        polygon.style.stroke = "blue";
        polygon.style.strokeWidth = "2";

        if (createNewSvg) {
          svg.appendChild(polygon);
          div.innerHTML = "";
          div.appendChild(svg);
        }
      }

      async getCachedRoute(start, end) {
        const startKey = `${start.lat()}_${start.lng()}`;
        const endKey = `${end.lat()}_${end.lng()}`;
        const cacheKey = `${startKey}_${endKey}`;

        if (this.routeCache[cacheKey]) {
          Logger.Log(`Using cached route for ${cacheKey}`);
          return this.routeCache[cacheKey];
        }

        return new Promise((resolve, reject) => {
          const request = {
            origin: start,
            destination: end,
            travelMode: "DRIVING",
          };

          this.directionsService.route(request, (result, status) => {
            if (status === "OK") {
              const route = result.routes[0].overview_path;
              this.routeCache[cacheKey] = route;
              resolve(route);
            } else {
              reject(`Directions request failed due to ${status}`);
            }
          });
        });
      }

      onRemove() {
        if (this.div) {
          this.div.parentNode.removeChild(this.div);
          this.div = null;
        }
      }

      updateAndRedraw(markers, map) {
        this.markers = markers;

        if (!this.map) {
          this.map = map;
          this.setMap(map);
        } else {
          this.draw();
        }
      }
    }

    this.class = DistrictOverlay;
  }
}

/**
 * CustomInfoWindowFactory
 *
 * This factory creates a custom InfoWindow that extends google.maps.OverlayView.
 * It provides more control over the InfoWindow behavior and styling.
 */
export class CustomInfoWindowFactory {
  constructor(maps) {
    class CustomInfoWindow extends maps.OverlayView {
      constructor(options) {
        super();
        this.customOptions = options.customOptions || {};
        this.position = options.position || new maps.LatLng(0, 0);
        this.content = options.content || "";
        this.boxStyle = options.boxStyle || {};
        this.stemStyle = options.stemStyle || {};
        this.pixelOffset = options.pixelOffset || new maps.Size(0, 0);
        this.visible = options.visible || true;
        this.onClose = options.onClose;
        this.onHover = options.onHover;
        this.onClick = options.onClick;
        this.div = null;
        this.stemDiv = null;

        Logger.BeginLog("CustomInfoWindow created");
        Logger.Log("Options:", options);
        Logger.Log("position:", this.position);
        Logger.Log("content:", this.content);
        Logger.Log("boxStyle:", this.boxStyle);
        Logger.Log("pixelOffset:", this.pixelOffset);
        Logger.Log("visible:", this.visible);
        Logger.EndLog();
      }

      getPosition() {
        return this.position;
      }

      onAdd() {
        if (!this.div) {
          this.div = document.createElement("div");
          this.div.className = "custom-info-window";
          this.div.style.position = "absolute";
          this.div.style.zIndex = 9999 + 1;
          this.div.style.display = "flex";
          this.div.style.flexDirection = "row";
          this.div.style.alignItems = "center";
          this.div.style.justifyContent = "center";
          this.div.style.backgroundColor = "rgba(255, 255, 255, 1)";
          this.div.style.backdropFilter = "blur(10px)";
          this.div.style.borderRadius = "5px";
          this.div.style.padding = "5px";

          this.div.addEventListener("pointerover", () => {
            if (this.onHover) this.onHover(this);
          });

          this.div.addEventListener("pointerleave", () => {
            if (this.onHover) this.onHover(null);
          });

          this.setBoxStyle();

          if (typeof this.content === "string") {
            this.div.innerHTML = this.content;
          } else {
            this.div.appendChild(this.content);
          }

          // Create the stem div
          this.stemDiv = document.createElement("div");
          this.stemDiv.className = "custom-info-window-stem";
          this.setStemStyle();
          this.div.appendChild(this.stemDiv);

          this.addCloseButton();

          const panes = this.getPanes();
          panes.floatPane.appendChild(this.div);
        }
      }

      draw() {
        const projection = this.getProjection();
        const pixel = projection.fromLatLngToDivPixel(this.position);
        if (this.div) {
          const mapDiv = this.getMap().getDiv();
          const mapWidth = mapDiv.offsetWidth;

          if (pixel.x < mapWidth / 2) {
            Logger.Log("Positioning to the right of the point");
            // Position to the right of the point
            this.div.style.left = pixel.x + this.pixelOffset.width + "px";
            this.stemDiv.style.left = "-10px"; // Position stem to the left of the div
          } else {
            Logger.Log("Positioning to the left of the point");
            // Position to the left of the point
            this.div.style.left =
              pixel.x - this.div.offsetWidth - this.pixelOffset.width + "px";
            this.stemDiv.style.left = this.div.offsetWidth - 10 + "px"; // Position stem to the right of the div
          }

          this.div.style.top = pixel.y + this.pixelOffset.height + "px";

          this.div.style.zIndex = 99999; // Ensure the overlay is always on top
          this.div.style.visibility = this.visible ? "visible" : "hidden";
        }
      }

      onRemove() {
        if (this.div) {
          this.div.parentNode.removeChild(this.div);
          this.div = null;
        }
      }

      setPosition(position) {
        this.position = position;
        if (this.div) {
          this.draw();
        }
      }

      setContent(content) {
        this.content = content;
        if (this.div) {
          if (typeof content === "string") {
            this.div.innerHTML = content;
          } else {
            this.div.innerHTML = "";
            this.div.appendChild(content);
          }
          this.div.appendChild(this.stemDiv); // Re-append the stem div
        }
      }

      setVisible(visible) {
        this.visible = visible;
        if (this.div) {
          this.div.style.visibility = this.visible ? "visible" : "hidden";
        }
      }

      setBoxStyle() {
        for (const key in this.boxStyle) {
          if (this.boxStyle.hasOwnProperty(key)) {
            this.div.style[key] = this.boxStyle[key];
          }
        }
      }

      setStemStyle() {
        const stemStyle = {
          position: "absolute",
          width: "0",
          height: "0",
          borderTop: "10px solid transparent",
          borderBottom: "10px solid transparent",
          borderRight: "10px solid white",
          top: "50%",
          backgroundColor: "transparent",
          transform: "translateY(-50%)",
          zIndex: 9999,
        };

        for (const key in stemStyle) {
          if (stemStyle.hasOwnProperty(key)) {
            this.stemDiv.style[key] = stemStyle[key];
          }
        }
      }

      addCloseButton() {
        const closeBox = document.createElement("div");
        closeBox.style.width = "12px";
        closeBox.style.height = "12px";
        // closeBox.style.position = "absolute";
        closeBox.style.right = this.customOptions.closeBoxMargin || "2px";
        closeBox.style.top = 0;
        closeBox.style.margin = "2px";
        closeBox.style.marginLeft = ".5em";
        closeBox.style.alignSelf = "start";
        closeBox.style.cursor = "pointer";
        closeBox.style.display = "flex";
        closeBox.style.alignItems = "center";
        closeBox.style.justifyContent = "center";

        // Create the close icon using pseudo-elements
        const closeIcon = document.createElement("div");
        closeIcon.style.position = "relative";
        closeIcon.style.width = "100%";
        closeIcon.style.height = "100%";

        const line1 = document.createElement("div");
        line1.style.position = "absolute";
        line1.style.width = "2px";
        line1.style.height = "100%";
        line1.style.backgroundColor = "#000";
        line1.style.transform = "rotate(45deg)";
        line1.style.top = "0";
        line1.style.left = "50%";
        line1.style.transformOrigin = "center";

        const line2 = document.createElement("div");
        line2.style.position = "absolute";
        line2.style.width = "2px";
        line2.style.height = "100%";
        line2.style.backgroundColor = "#000";
        line2.style.transform = "rotate(-45deg)";
        line2.style.top = "0";
        line2.style.left = "50%";
        line2.style.transformOrigin = "center";

        closeIcon.appendChild(line1);
        closeIcon.appendChild(line2);

        closeBox.appendChild(closeIcon);

        closeBox.addEventListener("click", () => {
          if (this.onClose) this.onClose(this);
        });

        this.div.appendChild(closeBox);
      }
    }

    this.class = CustomInfoWindow;
  }

  create(options) {
    return new this.class(options);
  }
}
