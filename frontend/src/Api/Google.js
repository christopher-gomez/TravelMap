const server =
    process.env.NODE_ENV === "production" ? "" : "http://localhost:8080";

export const getFamilyGoogleUsers = async () => {
    const response = await fetch(server + "/google/users");
    const data = await response.json();
    return data;
}