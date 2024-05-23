import { createPage, deletePage, updatePage } from "../Api/Notion";

/**
 *
 * @param {Array<{id: string, location: string}>} locations
 */
export const updateLocationProperties = async (loc, googleAccount) => {
  if (!googleAccount) return;

  if (Array.isArray(loc)) {
    loc.forEach(async (location) => {
      const response = await updatePage({
        id: location.id,
        properties: {
          Location: {
            rich_text: [
              {
                type: "text",
                text: { content: location.location },
              },
            ],
          },
        },
      });

      // console.log(response);
      return response;
    });
  } else {
    const response = await updatePage({
      id: loc.id,
      properties: {
        Location: {
          rich_text: [
            {
              type: "text",
              text: { content: loc.location },
            },
          ],
        },
      },
    });

    // console.log(response);
    return response;
  }
};

// export const findLocationLngLat = async (maps, location) => {
//   const geocoder = new maps.Geocoder();
//   const autoCompleteService = new maps.places.AutocompleteService();

//   if (Array.isArray(location)) {
//     let numLocations = location.length;
//     const lnglats = {};
//     location.forEach(async (loc) => {
//       console.log("finding " + loc + "placeID in maps");
//       autoCompleteService.getPlacePredictions(
//         { input: loc },
//         (predictions, status) => {
//           if (status === "OK") {
//             // console.log(predictions);

//             if (predictions.length === 0) return numLocations--;

//             const placeId = predictions[0].place_id;

//             // console.log('PlaceId for ' + loc + ' is ' + placeId);

//             // console.log('getting ' + loc + ' lnglt in maps');

//             geocoder.geocode({ placeId: placeId }, (results, status) => {
//               if (status === "OK") {
//                 // console.log(results[0]);
//                 lnglats[loc] = results[0].geometry.location;
//               } else {
//                 // console.log("Geocode was not successful for the following reason: " + status);
//               }

//               numLocations--;
//             });
//           } else {
//             // console.log("AutoComplete was not successful for the following reason: " + status);

//             numLocations--;
//           }
//         }
//       );
//       // geocoder.geocode({ placeId: loc }, (results, status) => {
//       //     if (status === "OK") {
//       //         console.log(results[0].geometry.location);
//       //         lnglats[loc] = results[0];
//       //     } else {
//       //         console.log("Geocode was not successful for the following reason: " + status);
//       //     }

//       //     numLocations--;
//       // });
//     });

//     return new Promise((resolve, reject) => {
//       const interval = setInterval(() => {
//         if (numLocations === 0) {
//           clearInterval(interval);
//           resolve(lnglats);
//         }
//       }, 1000);
//     });
//   } else {
//     let lnglat;

//     const promise = new Promise((res, rej) => {
//       // console.log('getting ' + location + ' placeID in maps');

//       autoCompleteService.getPlacePredictions(
//         { input: location },
//         (predictions, status) => {
//           if (status === "OK") {
//             // console.log(predictions);

//             if (predictions.length === 0) return rej("No predictions found");

//             const placeId = predictions[0].place_id;

//             // console.log('PlaceId for ' + location + ' is ' + placeId);

//             // console.log('getting ' + location + ' lnglt in maps');

//             geocoder.geocode({ placeId: placeId }, (results, status) => {
//               if (status === "OK") {
//                 // console.log(results[0]);
//                 lnglat = results[0].geometry.location;
//                 res(lnglat);
//               } else {
//                 // console.log("Geocode was not successful for the following reason: " + status);
//                 rej(status);
//               }
//             });
//           } else {
//             // console.log("AutoComplete was not successful for the following reason: " + status);

//             rej(status);
//           }
//         }
//       );
//     });

//     return promise;
//   }
// };

export const updateActivityDate = async (activity, googleAccount) => {
  if (!googleAccount) return;

  const date = activity.date.start || activity.date.end ? activity.date : null;

  const response = await updatePage({
    id: activity.id,
    properties: {
      Date: {
        date: date,
      },
    },
  });

  return response;
};

export const updateActivityTitle = async (activity, googleAccount) => {
  if (!googleAccount) return;

  const response = await updatePage({
    id: activity.id,
    properties: {
      Activity: {
        title: [
          {
            type: "text",
            text: {
              content: activity.info,
            },
            plain_text: activity.info,
          },
        ],
      },
    },
  });

  return response;
};

export const updateActivityTags = async (activity, googleAccount) => {
  if (!googleAccount) return;

  const response = await updatePage({
    id: activity.id,
    properties: {
      Tags: {
        multi_select: activity.tags.map((tag) => {
          return {
            name: tag,
          };
        }),
      },
    },
  });

  return response;
};

export const updateActivityTime = async (activity, googleAccount) => {
  if (!googleAccount) return;

  let select = activity.time ? { name: activity.time } : null;

  const response = await updatePage({
    id: activity.id,
    properties: {
      Time: {
        select: select,
      },
    },
  });

  return response;
};

export const createNewActivity = async (activity, googleAccount) => {
  if (!googleAccount) return;

  console.log("creating new activity", activity);

  const response = await createPage({
    properties: {
      Activity: {
        title: [
          {
            type: "text",
            text: {
              content: activity.info,
            },
            plain_text: activity.info,
          },
        ],
      },
      Date: {
        date: activity.date ? activity.date : null,
      },
      Time: {
        select: activity.time ? { name: activity.time } : null,
      },
      Tags: {
        multi_select: activity.tags
          ? activity.tags.map((tag) => {
              return {
                name: tag,
              };
            })
          : [],
      },
      Location: {
        rich_text: [
          {
            type: "text",
            text: {
              content: `[${activity.position.lat()}, ${activity.position.lng()}]`,
            },
          },
        ],
      },
      City: {
        multi_select: [{ name: activity.majorCity }],
      },
    },
  });

  return response;
};

export const updateActivityEmojiIcon = async (
  activity,
  emoji,
  googleAccount
) => {
  if (!googleAccount) return;

  const response = await updatePage({
    id: activity.id,
    icon: {
      type: "emoji",
      emoji: emoji,
    },
  });

  return response;
};

export const updateActivityGooglePlacePhotos = async (activity, photos) => {
  // if (!googleAccount) return;

  const formattedText = photos.join(", "); // Join array elements with a comma

  const response = await updatePage({
    id: activity.id,
    properties: {
      googlePlacePhotoURL: {
        rich_text: [
          {
            type: "text",
            text: { content: formattedText },
          },
        ],
      },
    },
  });

  return response;
};

export const updateActivityGooglePlaceID = async (activity, placeID) => {
  // if (!googleAccount) return;

  const response = await updatePage({
    id: activity.id,
    properties: {
      googlePlaceID: {
        rich_text: [
          {
            type: "text",
            text: { content: placeID },
          },
        ],
      },
    },
  });

  return response;
};

export const deleteActivity = async (activity, googleAccount) => {
  if (!googleAccount) return;

  const response = await deletePage(activity.id);

  return response;
}
