import api from './api';

export const traderService = {
  // Service Management
  createService: async (serviceData) => {
    const response = await api.post('/trader/services', serviceData);
    return response.data;
  },

  getMyServices: async () => {
    const response = await api.get('/trader/services');
    return response.data;
  },

  updateService: async (serviceId, serviceData) => {
    const response = await api.put(`/trader/services/${serviceId}`, serviceData);
    return response.data;
  },

  deleteService: async (serviceId) => {
    const response = await api.delete(`/trader/services/${serviceId}`);
    return response.data;
  },

  // Subscribers Management
  getMySubscribers: async () => {
    const response = await api.get('/trader/subscribers');
    return response.data;
  },

  // Trade Alerts
  sendTradeAlert: async (alertData) => {
    const response = await api.post('/trader/alerts', alertData);
    return response.data;
  },

  getMyAlerts: async () => {
    const response = await api.get('/trader/alerts');
    return response.data;
  },

  // Trade History
  getMyTrades: async () => {
    const response = await api.get('/trader/trades');
    return response.data;
  },

  createTrade: async (tradeData) => {
    const response = await api.post('/trader/trades', tradeData);
    return response.data;
  }
};
