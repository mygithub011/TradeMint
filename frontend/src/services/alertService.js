import api from './api';

const alertService = {
  // Client: Get all alerts received
  getMyAlerts: async (skip = 0, limit = 100, unreadOnly = false) => {
    const response = await api.get('/alerts/client/my-alerts', {
      params: { skip, limit, unread_only: unreadOnly }
    });
    return response.data;
  },

  // Client: Mark alert as read
  markAlertRead: async (recipientId) => {
    const response = await api.post(`/alerts/client/mark-read/${recipientId}`);
    return response.data;
  },

  // Client: Get unread count
  getUnreadCount: async () => {
    const response = await api.get('/alerts/client/unread-count');
    return response.data;
  },

  // Trader: Send trade alert
  sendAlert: async (alertData) => {
    const response = await api.post('/alerts/', alertData);
    return response.data;
  },

  // Trader: Get my sent alerts
  getMySentAlerts: async (skip = 0, limit = 100) => {
    const response = await api.get('/alerts/my-alerts', {
      params: { skip, limit }
    });
    return response.data;
  },

  // Trader: Get alerts for specific service
  getServiceAlerts: async (serviceId, skip = 0, limit = 50) => {
    const response = await api.get(`/alerts/service/${serviceId}`, {
      params: { skip, limit }
    });
    return response.data;
  },
};

export default alertService;
