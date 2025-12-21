import api from './api';

export const clientService = {
  // Subscriptions
  getMySubscriptions: async () => {
    const response = await api.get('/client/subscriptions');
    return response.data;
  },

  subscribe: async (serviceId) => {
    const response = await api.post(`/client/subscribe/${serviceId}`);
    return response.data;
  },

  cancelSubscription: async (subscriptionId) => {
    const response = await api.delete(`/client/subscriptions/${subscriptionId}`);
    return response.data;
  },

  // Trade History
  getMyTrades: async () => {
    const response = await api.get('/client/trades');
    return response.data;
  },

  // Marketplace
  getMarketplace: async () => {
    const response = await api.get('/marketplace/services');
    return response.data;
  },

  getServiceDetails: async (serviceId) => {
    const response = await api.get(`/marketplace/services/${serviceId}`);
    return response.data;
  },

  // Alerts
  getMyAlerts: async () => {
    const response = await api.get('/client/alerts');
    return response.data;
  }
};
