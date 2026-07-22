import axios from 'axios';
import { API_BASE_URL } from '../config/env';
import { notifySessionInvalid } from '../auth/sessionEvents';

const AUTH_PATHS = ['/api/auth/login', '/api/auth/register'];

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let pendingRequests = 0;
const pendingListeners = new Set();

const notifyPending = () => {
  pendingListeners.forEach((listener) => listener(pendingRequests));
};

export const subscribeApiLoading = (listener) => {
  pendingListeners.add(listener);
  return () => pendingListeners.delete(listener);
};

export const getApiPendingCount = () => pendingRequests;

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  pendingRequests += 1;
  notifyPending();

  return config;
});

api.interceptors.response.use(
  (response) => {
    pendingRequests = Math.max(0, pendingRequests - 1);
    notifyPending();
    return response;
  },
  (error) => {
    pendingRequests = Math.max(0, pendingRequests - 1);
    notifyPending();

    const status = error.response?.status;
    const url = error.config?.url || '';
    const isAuthRoute = AUTH_PATHS.some((p) => url.includes(p));

    if (status === 401 && !isAuthRoute) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete api.defaults.headers.common.Authorization;
      notifySessionInvalid();
    }

    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong';

    return Promise.reject({
      ...error,
      message,
    });
  }
);

export const authService = {
  login: (data) => api.post('/api/auth/login', data),
  register: (data) => api.post('/api/auth/register', data),
};

export const milkService = {
  getAll: (params = {}) => api.get('/api/milk', { params }),
  getMyMilk: () => api.get('/api/milk/my'),
  getLastForUser: (userId) => api.get(`/api/milk/last/${userId}`),
  getByUserAndMonth: (userId, month) =>
    api.get(`/api/milk/${userId}/month`, { params: { month } }),
  create: (data) => api.post('/api/milk', data),
  delete: (id) => api.delete(`/api/milk/${id}`),
};

export const orderService = {
  getAll: () => api.get('/api/orders'),
  getUserOrders: () => api.get('/api/orders/my'),
  create: (data) =>
    api.post('/api/orders', {
      quantity: data.quantity,
      time: data.time,
      description: data.description,
    }),
  updateStatus: (id, status) => api.put(`/api/orders/${id}`, { status }),
  delete: (id) => api.delete(`/api/orders/${id}`),
};

export const paymentService = {
  getAll: () => api.get('/api/payments'),
  getUserPayments: () => api.get('/api/payments/my'),
  createBill: (data) => api.post('/api/payments', data),
  update: (id, data) => api.put(`/api/payments/${id}`, data),
  delete: (id) => api.delete(`/api/payments/${id}`),
};

export const expenseService = {
  getAll: () => api.get('/api/expenses'),
  create: (data) => api.post('/api/expenses', data),
  update: (id, data) => api.put(`/api/expenses/${id}`, data),
  delete: (id) => api.delete(`/api/expenses/${id}`),
};

export const userService = {
  getAll: () => api.get('/api/users'),
  getById: (id) => api.get(`/api/users/${id}`),
  update: (id, data) => api.put(`/api/users/${id}`, data),
  delete: (id) => api.delete(`/api/users/${id}`),
};

export const buffaloService = {
  getAll: () => api.get('/api/buffalo'),
  getById: (id) => api.get(`/api/buffalo/${id}`),
  create: (data) => api.post('/api/buffalo', data),
  update: (id, data) => api.put(`/api/buffalo/${id}`, data),
  delete: (id) => api.delete(`/api/buffalo/${id}`),

  addMilk: (data) => api.post('/api/buffalo/milk', data),
  getMilks: (id) => api.get(`/api/buffalo/${id}/milk`),

  addChild: (data) => api.post('/api/buffalo/child', data),
  getChildren: (id) => api.get(`/api/buffalo/${id}/children`),

  addExpense: (data) => api.post('/api/buffalo/expense', data),
  getExpenses: (id) => api.get(`/api/buffalo/${id}/expenses`),

  addDeworming: (data) => api.post('/api/buffalo/deworming', data),
  getDeworming: (id) => api.get(`/api/buffalo/${id}/deworming`),

  addMating: (data) => api.post('/api/buffalo/mating', data),
  getMatings: (id) => api.get(`/api/buffalo/${id}/mating`),
};

export const pdfService = {
  downloadInvoice: async (paymentId) => {
    try {
      const response = await api.get(`/api/pdf/invoice/${paymentId}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');

      link.href = url;
      link.setAttribute('download', `invoice-${paymentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to download invoice', err);
      throw err;
    }
  },
};

export default api;