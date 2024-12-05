import axios from "axios";

const baseURL = "https://backend-sigma-orpin.vercel.app/";
export const api = axios.create({
    baseURL
});

export default api;
