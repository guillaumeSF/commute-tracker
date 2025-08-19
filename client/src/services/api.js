import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Trips API
export const tripsAPI = {
  getAll: () => api.get('/trips'),
  getById: (id) => api.get(`/trips/${id}`),
  create: (tripData) => api.post('/trips', tripData),
  update: (id, tripData) => api.put(`/trips/${id}`, tripData),
  delete: (id) => api.delete(`/trips/${id}`),
  getTravelTimes: (id, params = {}) => api.get(`/trips/${id}/travel-times`, { params }),
  checkNow: (id) => api.post(`/trips/${id}/check-now`),
};

// Analytics API
export const analyticsAPI = {
  getOverview: (params = {}) => api.get('/analytics/overview', { params }),
  getTripAnalytics: (id, params = {}) => api.get(`/analytics/trip/${id}`, { params }),
  getTrafficTrends: (params = {}) => api.get('/analytics/traffic-trends', { params }),
  getBestWorstTimes: (params = {}) => api.get('/analytics/best-worst-times', { params }),
};

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;
