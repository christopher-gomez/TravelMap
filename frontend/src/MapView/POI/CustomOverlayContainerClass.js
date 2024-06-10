import ReactDOM from "react-dom";
import "./OverlayStyles.css";

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

        // console.log(panes);

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
        //   console.log("No label overlay found");
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
        console.log("removing vignette overlay");
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
        this.div = null;
        this.stemDiv = null;

        console.groupCollapsed("CustomInfoWindow created");
        console.log("Options:", options);
        console.log("position:", this.position);
        console.log("content:", this.content);
        console.log("boxStyle:", this.boxStyle);
        console.log("pixelOffset:", this.pixelOffset);
        console.log("visible:", this.visible);
        console.groupEnd();
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

          const panes = this.getPanes();
          panes.overlayLayer.appendChild(this.div);

          // this.addCloseButton();
        }
      }

      draw() {
        const projection = this.getProjection();
        const pixel = projection.fromLatLngToDivPixel(this.position);
        if (this.div) {
          const mapDiv = this.getMap().getDiv();
          const mapWidth = mapDiv.offsetWidth;

          if (pixel.x < mapWidth / 2) {
            console.log("Positioning to the right of the point");
            // Position to the right of the point
            this.div.style.left = pixel.x + this.pixelOffset.width + "px";
            this.stemDiv.style.left = "-10px"; // Position stem to the left of the div
          } else {
            console.log("Positioning to the left of the point");
            // Position to the left of the point
            this.div.style.left = (pixel.x - this.div.offsetWidth - this.pixelOffset.width) + "px";
            this.stemDiv.style.left = (this.div.offsetWidth - 10) + "px"; // Position stem to the right of the div
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
        if (!this.customOptions.closeBoxURL) return;

        const closeBox = document.createElement("img");
        closeBox.src = this.customOptions.closeBoxURL;
        closeBox.style.cursor = "pointer";
        closeBox.style.position = "absolute";
        closeBox.style.right = this.customOptions.closeBoxMargin || "2px";
        closeBox.style.top = this.customOptions.closeBoxMargin || "2px";

        closeBox.addEventListener("click", () => {
          this.setVisible(false);
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

