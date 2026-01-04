import axios from "axios";

// API Base URL - change this to your production URL when deploying
const API_BASE_URL = "https://opex.bemsol.com/backend/public/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
  headers: {
    "Accept": "application/json",
    "Content-Type": "application/json",
  },
});

// Attach token automatically if exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("roles");
      localStorage.removeItem("permissions");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
