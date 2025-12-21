import api from './api';

export const traderService = {
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

  // Subscribers Management - Get subscribers for each service
  getServiceSubscribers: async (serviceId) => {
    const response = await api.get(`/subscriptions/service/${serviceId}/subscribers`);
    return response.data;
  },

  getMySubscribers: async () => {
    // Get all services for the trader, then get subscribers for each
    const services = await traderService.getMyServices();
    const allSubscribers = [];
    
    for (const service of services) {
      try {
        const subscribers = await traderService.getServiceSubscribers(service.id);
        allSubscribers.push(...subscribers);
      } catch (error) {
        console.error(`Failed to get subscribers for service ${service.id}:`, error);
      }
    }
    
    return allSubscribers;
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
  }
};
