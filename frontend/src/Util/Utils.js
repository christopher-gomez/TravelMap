export function isTouchDevice() {
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );
}

export function findNearbyMarkers(
  markersArray1,
  markersArray2,
  maps,
  maxDistance = 1000
) {
  let nearbyMarkers = [];

  // Iterate over the first array of markers
  markersArray1.forEach((marker1) => {
    const latLng1 = marker1.position;
    // Check against all markers in the second array
    markersArray2.forEach((marker2) => {
      const latLng2 = marker2.position;

      // Calculate the distance between two markers
      const distance = maps.geometry.spherical.computeDistanceBetween(
        latLng1,
        latLng2
      );

      // If the distance is less than or equal to the maxDistance, add to results
      if (distance <= maxDistance) {
        nearbyMarkers.push(marker2);
      }
    });
  });

  // Remove duplicates if any marker in array2 matches multiple markers in array1
  const uniqueNearbyMarkers = [
    ...new Set(
      nearbyMarkers.filter((m) => !markersArray1.find((m1) => m1.id === m.id))
    ),
  ];

  return uniqueNearbyMarkers;
}

export function createCompositeIcon(urls, callback) {
  const canvas = document.createElement("canvas");
  canvas.width = 400; // Set width
  canvas.height = 400; // Set height
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  let loadedImages = 0;
  const images = [];

  urls.forEach((url, index) => {
    const img = new Image();
    img.crossOrigin = "Anonymous"; // Handle CORS
    img.onload = () => {
      images[index] = img;
      loadedImages++;
      if (loadedImages === urls.length) {
        drawImages(ctx, images);
        const dataUrl = canvas.toDataURL("image/png");
        callback(dataUrl);
        document.body.removeChild(canvas); // Clean up canvas
      }
    };
    img.onerror = () => {
      console.error("Error loading image:", url);
    };
    img.src = url;
  });
}

function drawImages(ctx, images, canvasWidth, canvasHeight) {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight); // Clear the canvas

  const padding = 1; // Padding between images
  const maxImageSize =
    Math.min(canvasWidth, canvasHeight) / Math.sqrt(images.length) - padding; // Calculate max size of each image

  // Positioning variables
  let x = 0,
    y = 0;
  let rowHeight = 0;

  images.forEach((img, index) => {
    // Scale images to fit
    const scale = Math.min(maxImageSize / img.width, maxImageSize / img.height);
    const imgWidth = img.width * scale;
    const imgHeight = img.height * scale;

    // Move to next row if no space in the current row
    if (x + imgWidth > canvasWidth) {
      x = 0;
      y += rowHeight + padding;
      rowHeight = 0;
    }

    // Draw the image
    ctx.drawImage(img, x, y, imgWidth, imgHeight);

    // Update x position for next image and track row height
    x += imgWidth + padding;
    rowHeight = Math.max(rowHeight, imgHeight);

    // Reset x and increase y at the end of a row
    if (index === images.length - 1 || x + imgWidth > canvasWidth) {
      x = 0;
      y += rowHeight + padding;
    }
  });
}

export function findMarkerAddresses(markers, geocoder) {
  markers.forEach((marker) => {
    const latlng = marker.position;
    geocoder.geocode({ location: latlng }, function (results, status) {
      if (status === "OK") {
        if (results[0]) {
          const addressComponents = results[0].address_components;
          const cityComponent = addressComponents.find((component) =>
            component.types.includes("locality")
          );
          const city = cityComponent
            ? cityComponent.long_name
            : "City not found";
          console.log(
            `Coordinates: (${marker.lat()}, ${marker.lng()}) - City: ${city}`
          );

          marker["address"] = addressComponents;
        } else {
          console.log("No results found");
        }
      } else {
        console.log("Geocoder failed due to: " + status);
      }
    });
  });
}

export function getUniqueCitiesFromMarkers(markers, geocoder) {
  const promises = markers.map((marker) => {
    return new Promise((resolve, reject) => {
      const latlng = marker.position;
      geocoder.geocode({ location: latlng }, (results, status) => {
        if (status === "OK") {
          if (results[0]) {
            const majorCityComponent = results[0].address_components.find(
              (component) =>
                component.types.includes("administrative_area_level_1")
            );

            marker["address"] = results[0].formatted_address;
            marker["majorCity"] = majorCityComponent.long_name;
            if (majorCityComponent) {
              resolve(majorCityComponent.long_name);
            } else {
              resolve(null); // No city found in the geocode result
            }
          } else {
            resolve(null); // No results for geocode
          }
        } else {
          reject(
            "Geocode was not successful for the following reason: " + status
          );
        }
      });
    });
  });

  return Promise.all(promises)
    .then((results) => {
      const cities = new Set(results.filter((city) => city !== null));
      return Array.from(cities);
    })
    .catch((error) => {
      console.error("Error in geocoding: ", error);
    });
}

export function findPlacesOfInterest(
  markers,
  allMarkers,
  placesService,
  callback,
  radius = 1000,
  types = [
    "amusement_park",
    "aquarium",
    "art_gallery",
    "bakery",
    "bar",
    "cafe",
    "casino",
    "department_store",
    "museum",
    "night_club",
    "park",
    "restaurant",
    "shopping_mall",
    "spa",
    "stadium",
    "tourist_attraction",
    "zoo",
  ],
  skipAirports = true,
  filterOutNonLatinNames = true
) {
  const uniquePlaces = new Set();
  const promises = [];
  const placesOfInterest = [];
  // Regular expression to check for non-Latin characters
  const latinCharRegex = /^[\x00-\x7F]+$/;

  markers.forEach((marker) => {
    // Check if the marker is associated with an airport and skip if true
    if (
      skipAirports &&
      marker.marker.tags &&
      marker.marker.tags.includes("Airport")
    ) {
      // Still resolve the promise for this marker to keep the count accurate
      promises.push(Promise.resolve());
      return;
    }

    types.forEach((type) => {
      const request = {
        location: marker.position,
        radius,
        type,
        language: "en",
      };

      const promise = new Promise((resolve, reject) => {
        placesService.nearbySearch(request, (results, status) => {
          if (status === "OK") {
            results.forEach((place) => {
              if (
                !uniquePlaces.has(place.place_id) &&
                !allMarkers.some((m) => m.placeId === place.place_id) &&
                !place.types.includes("lodging") &&
                !place.types.includes("political")
              ) {
                if (
                  place.business_status &&
                  place.business_status !== "OPERATIONAL"
                ) {
                  resolve();
                  return;
                }

                if (
                  filterOutNonLatinNames &&
                  !latinCharRegex.test(place.name)
                ) {
                  resolve();
                  return;
                }

                uniquePlaces.add(place.place_id);
                placesOfInterest.push(place);
              }
            });
          }

          resolve(); // Always resolve to ensure all promises complete
        });
      });

      promises.push(promise);
    });
  });

  Promise.all(promises).then(() => {
    callback(Array.from(placesOfInterest));
  });
}

export async function createMarkersFromPOIs(
  pois,
  maps,
  geocoder,
  createOverlay,
  onMarkerMouseOver,
  onMarkerMouseOut,
  onMarkerClick
) {
  const markers = [];
  for (const item of pois) {
    const marker = new maps.Marker({
      // map,
      position: item.geometry.location,
      title: "",
      // icon: item.icon,
    });
    // marker["title"] = item.name;
    marker["placeId"] = item.place_id;
    marker["info"] = item.name;
    marker["id"] = item.reference;
    if (item.photos)
      marker["photo"] = item.photos.map((photo) =>
        photo.getUrl({
          maxWidth: 400,
          maxHeight: 400,
        })
      );
    marker["types"] = item.types;
    marker["isPlacesPOI"] = true;
    marker["rating"] = item.rating;
    marker["userRatingsTotal"] = item.user_ratings_total;
    marker["isOpen"] = item.opening_hours ? item.opening_hours.open_now : null;

    // if (item.icon && item.icon in ICON_KEYS) marker["iconKey"] = item.icon;

    // marker["info"] = item.title;
    // marker["description"] = item.description;
    // marker["tags"] = item.tags;
    // marker["date"] = item.date;
    // marker["day"] = calculateDay(item.date);
    // marker["time"] = item.time;
    // marker["timelineOverride"] = item.timelineOverride;
    // marker["placesSearchName"] = item.placesSearchName;
    // if (marker.tags && marker.tags.includes("Accommodation")) {
    //   marker.timelineOverride = { ...marker.timelineOverride, misc: [1, 4] };
    // }
    // marker["city"] = item.city;
    // marker["related"] = item.related;
    // marker["link"] = item.link;

    if (createOverlay)
      marker["overlay"] = createOverlay({
        marker,
        title: item.name,
        type: "title",
        offsetY: 0,
      });

    if (onMarkerMouseOver)
      marker.addListener("mouseover", () => {
        onMarkerMouseOver(marker);
      });
    if (onMarkerMouseOut)
      marker.addListener("mouseout", () => onMarkerMouseOut(marker));
    if (onMarkerClick) marker.addListener("click", () => onMarkerClick(marker));
    markers.push(marker);

    // const overlay = createOverlay({
    //   marker: item,
    //   type: "title",
    //   offsetY:
    //     item.icon !== null && item.icon in ICON_KEYS
    //       ? ICON_KEYS[item.icon].offsetY
    //       : 20,
    // });
  }

  await getUniqueCitiesFromMarkers(markers, geocoder);

  return markers;
}

export function createEmojiIcon(emoji, callback) {
  const canvas = document.createElement("canvas");
  canvas.width = 100;
  canvas.height = 100;
  const ctx = canvas.getContext("2d");

  // Style adjustments might be needed depending on the emoji
  ctx.font = "48px serif"; // Adjust font size and family as needed
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(emoji, 50, 50); // Center the emoji

  // Convert canvas to PNG URL
  const dataUrl = canvas.toDataURL("image/png");

  if (canvas.parentNode) {
    canvas.parentNode.removeChild(canvas);
  }
  callback(dataUrl);
}
