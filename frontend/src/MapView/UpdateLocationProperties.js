import { updatePage } from "../Api/Notion";

/**
 * 
 * @param {Array<{id: string, location: string}>} locations 
 */
export const updateLocationProperties = async (loc) => {

    if (Array.isArray(loc)) {
        loc.forEach(async (location) => {
            const response = await updatePage({
                id: location.id, properties: {
                    Location: {
                        rich_text: [
                            {
                                type: "text",
                                text: { content: location.location },
                            },
                        ],
                    },
                }
            });

            // console.log(response);
            return response;
        });
    } else {
        const response = await updatePage({
            id: loc.id, properties: {
                Location: {
                    rich_text: [
                        {
                            type: "text",
                            text: { content: loc.location },
                        },
                    ],
                },
            }
        });

        // console.log(response);
        return response;

    }
}

export const findLocationLngLat = async (maps, location) => {
    const geocoder = new maps.Geocoder();
    const autoCompleteService = new maps.places.AutocompleteService();

    if (Array.isArray(location)) {
        let numLocations = location.length;
        const lnglats = {};
        location.forEach(async (loc) => {
            console.log('finding ' + loc + 'placeID in maps');
            autoCompleteService.getPlacePredictions({ input: loc }, (predictions, status) => {
                if (status === "OK") {
                    // console.log(predictions);

                    if (predictions.length === 0)
                        return numLocations--;

                    const placeId = predictions[0].place_id;

                    // console.log('PlaceId for ' + loc + ' is ' + placeId);

                    // console.log('getting ' + loc + ' lnglt in maps');

                    geocoder.geocode({ placeId: placeId }, (results, status) => {
                        if (status === "OK") {
                            // console.log(results[0]);
                            lnglats[loc] = results[0].geometry.location;
                        } else {
                            // console.log("Geocode was not successful for the following reason: " + status);
                        }

                        numLocations--;
                    });
                } else {
                    // console.log("AutoComplete was not successful for the following reason: " + status);

                    numLocations--;
                }
            });
            // geocoder.geocode({ placeId: loc }, (results, status) => {
            //     if (status === "OK") {
            //         console.log(results[0].geometry.location);
            //         lnglats[loc] = results[0];
            //     } else {
            //         console.log("Geocode was not successful for the following reason: " + status);
            //     }

            //     numLocations--;
            // });
        });

        return new Promise((resolve, reject) => {
            const interval = setInterval(() => {
                if (numLocations === 0) {
                    clearInterval(interval);
                    resolve(lnglats);
                }
            }, 1000);
        });
    } else {
        let lnglat;

        const promise = new Promise((res, rej) => {
            // console.log('getting ' + location + ' placeID in maps');

            autoCompleteService.getPlacePredictions({ input: location }, (predictions, status) => {
                if (status === "OK") {
                    // console.log(predictions);

                    if (predictions.length === 0)
                        return rej('No predictions found');

                    const placeId = predictions[0].place_id;

                    // console.log('PlaceId for ' + location + ' is ' + placeId);

                    // console.log('getting ' + location + ' lnglt in maps');

                    geocoder.geocode({ placeId: placeId }, (results, status) => {
                        if (status === "OK") {
                            // console.log(results[0]);
                            lnglat = results[0].geometry.location;
                            res(lnglat);
                        } else {
                            // console.log("Geocode was not successful for the following reason: " + status);
                            rej(status);
                        }
                    });
                } else {
                    // console.log("AutoComplete was not successful for the following reason: " + status);

                    rej(status);
                }
            });


        });

        return promise;
    }
}