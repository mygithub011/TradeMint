import api from './api';

export const clientService = {
  // Subscriptions
  getMySubscriptions: async () => {
    const response = await api.get('/subscriptions/');
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
    // TODO: Implement trades endpoint in backend
    return [];
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
    const response = await api.get('/alerts/my-alerts');
    return response.data;
  }
};
