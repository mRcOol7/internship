import axios from "axios";

export const api = axios.create({
    // baseURL: "http://localhost:5000/",
    baseURL: "https://backend-sigma-orpin.vercel.app/",
});

export default api;
