import axios from "axios";

// In development Vite proxies /api to the Express server, so the default
// works with no env file. Set VITE_API_URL for a deployed API.
const baseURL = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({ baseURL, headers: { Accept: "application/json" } });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("resolvex.token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const path = window.location.pathname;
    const onAuthPage = ["/login", "/register", "/admin-login", "/"].includes(path);

    if (status === 401 && !onAuthPage) {
      localStorage.removeItem("resolvex.token");
      localStorage.removeItem("resolvex.user");
      window.location.assign("/login");
    }

    return Promise.reject(error);
  }
);

export const apiBaseUrl = baseURL;
export default api;
