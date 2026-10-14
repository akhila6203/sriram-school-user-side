import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:4000/api",
  timeout: 15000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });

    const message =
      error.response?.data?.message ||
      (error.code === "ECONNABORTED"
        ? "Server request timed out"
        : !error.response
        ? "Cannot reach backend server. Check API URL and backend."
        : error.message);

    return Promise.reject(new Error(message));
  }
);

export default api;