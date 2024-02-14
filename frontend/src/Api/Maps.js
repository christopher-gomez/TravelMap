const server =
    process.env.NODE_ENV === "production" ? "" : "http://localhost:8080";

export const getGoogleMapsApiKey = async () => {
    const response = await fetch(server + "/maps/api");
    const data = await response.json();
    return data.key;
}