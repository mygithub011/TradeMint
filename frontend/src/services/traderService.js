import api from './api';

export const traderService = {
  // Profile Management
  getMyProfile: async () => {
    const response = await api.get('/traders/me');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/traders/profile', profileData);
    return response.data;
  },

  // Service Management
  createService: async (serviceData) => {
    const response = await api.post('/traders/services', serviceData);
    return response.data;
  },

  getMyServices: async () => {
    const response = await api.get('/traders/services');
    return response.data;
  },

  updateService: async (serviceId, serviceData) => {
    const response = await api.put(`/services/${serviceId}`, serviceData);
    return response.data;
  },

  deleteService: async (serviceId) => {
    const response = await api.delete(`/services/${serviceId}`);
    return response.data;
  },

  // Subscribers Management
  getMySubscribers: async () => {
    const response = await api.get('/traders/subscribers');
    return response.data;
  },

  // Get subscribers for a specific service
  getServiceSubscribers: async (serviceId) => {
    const response = await api.get(`/subscriptions/service/${serviceId}/subscribers`);
    return response.data;
  },

  // Trade Alerts
  sendTradeAlert: async (alertData) => {
    const response = await api.post('/alerts/', alertData);
    return response.data;
  },

  getMyAlerts: async () => {
    const response = await api.get('/alerts/my-alerts');
    return response.data;
  },

  // Trade History
  getMyTrades: async () => {
    // For now, returning empty array as trades endpoint may not exist
    return [];
  },

  createTrade: async (tradeData) => {
    const response = await api.post('/alerts/', tradeData);
    return response.data;
  },

  // Analytics
  getAnalytics: async () => {
    const response = await api.get('/traders/analytics');
    return response.data;
  }
};
