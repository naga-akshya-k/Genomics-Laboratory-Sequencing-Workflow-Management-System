import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_URL || '';
const baseURL = rawApiUrl
  ? `${rawApiUrl.replace(/\/+$/, '')}/api/v1`
  : '/api/v1';

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach Bearer token from localStorage for cross-domain support
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
    }
    const customError = {
      status: error.response?.status || 500,
      message:
        error.response?.data?.message ||
        error.response?.data?.errors?.map((e) => e.message || e).join(', ') ||
        error.message ||
        'An unexpected server error occurred',
      errors: error.response?.data?.errors || [],
    };
    return Promise.reject(customError);
  }
);

export default api;
