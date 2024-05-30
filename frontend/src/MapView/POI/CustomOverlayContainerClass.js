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

        this.setMap(map);
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

        // Create the transparent window overlay
        const windowOverlay = document.createElement("div");
        windowOverlay.style.position = "absolute";
        windowOverlay.style.background = "transparent";
        windowOverlay.style.pointerEvents = "none";
        windowOverlay.style.borderRadius = "50%";

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

        const padding = 100; // Padding in pixels
        sw.x -= padding;
        sw.y += padding;
        ne.x += padding;
        ne.y -= padding;

        // Calculate the required width to fit the label overlay
        let requiredWidth = ne.x - sw.x;
        let requiredHeight = sw.y - ne.y;
        if (this.labelOverlay && this.labelOverlay.div) {
          const labelWidth = this.labelOverlay.div.children[0].clientWidth;
          const labelHeight = this.labelOverlay.div.children[0].clientHeight;
          if (requiredWidth < labelWidth) {
            requiredWidth = labelWidth + padding;
          }
          if (requiredHeight < labelHeight) {
            requiredHeight = labelHeight + padding;
          }
        }
        const requiredSize = Math.max(requiredWidth, requiredHeight);

        const windowOverlay = this.windowOverlay;
        const centerX = (sw.x + ne.x) / 2;
        const centerY = (sw.y + ne.y) / 2;

        windowOverlay.style.left = centerX - requiredSize  / 2 + "px";
        windowOverlay.style.top = centerY - requiredSize  / 2 + "px";
        windowOverlay.style.width = requiredSize  + "px";
        windowOverlay.style.height = requiredSize  + "px";
        windowOverlay.style.boxShadow = `0 0 0 9999px rgba(0, 0, 0, 0.8)`;
      }

      onRemove() {
        if (this.div) {
          this.div.parentNode.removeChild(this.div);
          this.div = null;
        }
      }
    }

    this.class = VignetteOverlay;
  }
}
