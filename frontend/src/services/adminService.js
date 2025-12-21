import api from './api';

export const adminService = {
  // Trader Approval
  getPendingTraders: async () => {
    const response = await api.get('/admin/traders/pending');
    return response.data;
  },

  approveTrader: async (traderId) => {
    const response = await api.post(`/admin/traders/${traderId}/approve`);
    return response.data;
  },

  rejectTrader: async (traderId) => {
    const response = await api.post(`/admin/traders/${traderId}/reject`);
    return response.data;
  },

  // Platform Stats
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  // User Management
  getAllUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  getAllTraders: async () => {
    const response = await api.get('/admin/traders');
    return response.data;
  },

  getAllServices: async () => {
    const response = await api.get('/admin/services');
    return response.data;
  },

  getAllSubscriptions: async () => {
    const response = await api.get('/admin/subscriptions');
    return response.data;
  }
};
