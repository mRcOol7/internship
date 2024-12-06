import axios from "axios";

// const baseURL = "https://backend-sigma-orpin.vercel.app";
const baseURL = "http://localhost:5000/";

export const api = axios.create({
    baseURL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

export default api;
