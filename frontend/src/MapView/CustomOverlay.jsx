// import React from "react";
// import ReactDOM from "react-dom";
// import { OverlayView } from 'google-map-react/dist/index'
// import "./OverlayStyles.css";

// function MyCustomOverlay({ text, className }) {
//   return <div className={className}>{text}</div>;
// }

// export default class CustomOverlay extends OverlayView {
//   constructor(position, text, map, type, offsetY, offsetX) {
//     super();
//     this.position = position;
//     this.text = text;
//     this.setMap(map); // Associates the overlay with a map
//     this.type = type;
//     this.offsetX = offsetX;
//     this.offsetY = offsetY;
//   }

//   // Called when the overlay is added to the map
//   onAdd() {
//     this.containerElement = document.createElement("div");
//     this.getPanes().overlayLayer.appendChild(this.containerElement);
//   }

//   // Called each time the overlay needs to draw itself
//   draw() {
//     const projection = this.getProjection();
//     const position = projection.fromLatLngToDivPixel(this.position);

//     if (this.containerElement) {
//       let offsetY = this.offsetY ?? 5;
//       // if(item.title in OVERRIDE_ICONS) {
//       //   // console.log(markers[item.title])
//       //   // offsetY = markers[item.title].icon.scaledSize[1]; // Position the div below the marker
//       // }

//       let offsetX = this.offsetX ?? this.containerElement.clientWidth / 2; // Center the div over the marker

//       this.containerElement.style.left = position.x - offsetX + "px";
//       this.containerElement.style.top = position.y + offsetY + "px";

//       this.containerElement.style.zIndex = 99999; // Ensure the overlay is always on top
//       // Set the position of the container element
//     //   const style = this.containerElement.style;
//     //   style.left = position.x + "px";
//     //   style.top = position.y + "px";
//     //   style.position = "absolute";

//       let className = "LocationTitleWindow";

//       if (this.type === "info") {
//         className = "LocationInfoWindow";
//       }

//       if (this.type === "icon") {
//         className = "LocationIconWindow";
//       }

//       // Render the React component inside the container
//       ReactDOM.render(
//         <MyCustomOverlay text={this.text} className={className} />,
//         this.containerElement
//       );
//     }
//   }

//   // Called when the overlay is removed from the map
//   onRemove() {
//     if (this.containerElement) {
//       ReactDOM.unmountComponentAtNode(this.containerElement);
//       this.containerElement.parentNode.removeChild(this.containerElement);
//       this.containerElement = null;
//     }
//   }
// }
