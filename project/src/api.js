import axios from "axios";

const baseURL = process.env.REACT_APP_API_URL_PRODUCTION || 'http://localhost:5000/'; 

export const api = axios.create({
  baseURL, 
  timeout: 5000, 
});

export default api;
