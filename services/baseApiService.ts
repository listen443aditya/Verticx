
// src/services/baseApiService.ts
import axios from 'axios';

// Get the API base URL from your environment variables (.env.local file)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://verticx-backend.vercel.app/api"; // Defaulting to your production URL

// Create the single, real API client instance for your entire application
const baseApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach the token to every outgoing request using an interceptor
baseApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    // If a token exists, add the Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    // Handle request setup errors
    return Promise.reject(error);
  }
);

// ---> CRITICAL: Export the instance so other files can import and use it. <---
export default baseApi;