import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3000/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (userData) => api.post('/users/register', userData),
  login: (credentials) => api.post('/users/login', credentials),
  logout: () => api.post('/users/logout'),
  getCurrentUser: () => api.post('/users/current-user'),
  updateDetails: (details) => api.post('/users/update-details', details),
  changePassword: (passwordData) => api.post('/users/change-password', passwordData),
};

export const campaignAPI = {
  getAll: (params) => api.get('/campaigns', { params }),
  getById: (id) => api.get(`/campaigns/${id}`),
  getCategories: () => api.get('/campaigns/categories'),
  create: (campaignData) => api.post('/campaigns/create', campaignData),
  update: (id, campaignData) => api.put(`/campaigns/${id}`, campaignData),
  delete: (id) => api.delete(`/campaigns/${id}`),
  getMyCampaigns: (params) => api.get('/campaigns/my-campaigns', { params }),
};

export const donationAPI = {
  donate: (donationData) => api.post('/donations/donate', donationData),
  getHistory: (params) => api.get('/donations/history', { params }),
  getSupportedCampaigns: (params) => api.get('/donations/supported-campaigns', { params }),
  getCampaignDonations: (campaignId, params) => 
    api.get(`/donations/campaign/${campaignId}`, { params }),
  getById: (id) => api.get(`/donations/${id}`),
};

export const dashboardAPI = {
  getNGODashboard: () => api.get('/dashboard/ngo'),
  getDonorDashboard: () => api.get('/dashboard/donor'),
  getStats: () => api.get('/dashboard/stats'),
};

export default api;