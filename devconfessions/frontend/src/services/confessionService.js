import api from './api';

export const confessionService = {
  // Get all confessions with pagination, filtering, and sorting
  getConfessions: async (params = {}) => {
    const response = await api.get('/confessions', { params });
    return response.data;
  },

  // Create a new confession
  createConfession: async (data) => {
    const response = await api.post('/confessions', data);
    return response.data;
  },

  // Like a confession
  likeConfession: async (id) => {
    const response = await api.patch(`/confessions/${id}/like`);
    return response.data;
  },

  // Delete a confession (admin only)
  deleteConfession: async (id) => {
    const response = await api.delete(`/confessions/${id}`);
    return response.data;
  },

  // Get all confessions for admin
  getAllConfessionsAdmin: async (params = {}) => {
    const response = await api.get('/confessions/admin/all', { params });
    return response.data;
  },

  // Get confession statistics (admin only)
  getStats: async () => {
    const response = await api.get('/confessions/stats');
    return response.data;
  },
};

export default confessionService;
