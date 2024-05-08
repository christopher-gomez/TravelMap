import ReactDOM from "react-dom";
import "./OverlayStyles.css";

export default class CustomOverlayContainerFactory {
    constructor(maps) {

        class CustomOverlay extends maps.OverlayView {
            constructor(map, { location, onClick, offsetY, offsetX, type }, Component, componentProps) {
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

                if (this.className !== undefined)
                    div.className = this.className;
                else
                    div.style.position = "absolute";

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
        }

        this.class = CustomOverlay;
    }
}