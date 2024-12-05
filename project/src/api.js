import axios from "axios";

const baseURL = process.env.NODE_ENV === 'production' || window.location.hostname !== 'localhost'
    ? "https://backend-sigma-orpin.vercel.app"
    : "http://localhost:5000";

export const api = axios.create({
    baseURL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

export default api;
