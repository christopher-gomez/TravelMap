const server =
    process.env.NODE_ENV === "production" ? "" : "http://localhost:8080";

export const getGoogleMapsApiKey = async () => {
    const response = await fetch(server + "/maps/api");
    const data = await response.json();
    return data.key;
}

export const getTransitDirections = async (origin, destination) => {
    origin = origin.lat() + "," + origin.lng();
    destination = destination.lat() + "," + destination.lng();
    const response = await fetch(
        `${server}/maps/api/directions?origin=${origin}&destination=${destination}`
    );
    const data = await response.json();
    return data;
}