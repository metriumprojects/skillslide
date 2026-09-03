import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:5000/api",
    // baseURL: "https://skillslide.com/api",
});
export default api;

// export const host = "ws://localhost:5000";
export const host = "https://skillslide.com";
export const socketHost = "https://skillslide.com"
// export const socketHost = "ws://localhost:5000"
