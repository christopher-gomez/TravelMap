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

export function createCanvas(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.style.display = "none"; // Hide the canvas element
  document.body.appendChild(canvas); // Add to the document
  const context = canvas.getContext("2d");
  return { canvas, context };
}

export function removeCanvas(canvas) {
  canvas.parentNode.removeChild(canvas);
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

export function drawImages(ctx, images, canvasWidth, canvasHeight) {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight); // Clear the canvas

    const padding = 1; // Padding between images
    const maxImageSize = Math.min(canvasWidth, canvasHeight) / Math.sqrt(images.length) - padding; // Calculate max size of each image

    // Positioning variables
    let x = 0, y = 0;
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

