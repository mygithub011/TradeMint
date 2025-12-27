import api from './api';

export const adminService = {
  // Trader Approval
  getPendingTraders: async () => {
    console.log('📡 Calling GET /admin/traders/pending');
    try {
      const response = await api.get('/admin/traders/pending');
      console.log('✅ Response received:', response);
      console.log('Response data:', response.data);
      console.log('Response status:', response.status);
      return response.data;
    } catch (error) {
      console.error('❌ getPendingTraders error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },

  approveTrader: async (traderId) => {
    const response = await api.post(`/admin/traders/${traderId}/approve`);
    return response.data;
  },

  rejectTrader: async (traderId, reason) => {
    const response = await api.post(`/admin/traders/${traderId}/reject`, null, {
      params: { reason }
    });
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
