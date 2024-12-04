import axios from "axios";

const baseURL = process.env.NODE_ENV === 'production'
    ? process.env.REACT_APP_API_URL || "https://backend-sigma-orpin.vercel.app"
    : process.env.REACT_APP_API_URL_DEV || "http://localhost:5000";

export const api = axios.create({
    baseURL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

export default api;
