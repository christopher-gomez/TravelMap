
const path = process.env.NODE_ENV === "production" ? "./.env" : "./.env.local";
require("dotenv").config({ path });