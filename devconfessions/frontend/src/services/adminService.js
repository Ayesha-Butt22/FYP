import api from './api';

export const adminService = {
  // Admin login
  login: async (email, password) => {
    const response = await api.post('/admin/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('adminToken', response.data.token);
    }
    return response.data;
  },

  // Admin logout
  logout: () => {
    localStorage.removeItem('adminToken');
  },

  // Get admin profile
  getProfile: async () => {
    const response = await api.get('/admin/profile');
    return response.data;
  },

  // Update password
  updatePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/admin/password', { currentPassword, newPassword });
    return response.data;
  },

  // Check if admin is logged in
  isAuthenticated: () => {
    return !!localStorage.getItem('adminToken');
  },
};

export default adminService;
