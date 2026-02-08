import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Attach JWT token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const signup = (email, password) =>
  api.post('/auth/signup', { email, password });

export const login = (email, password) =>
  api.post('/auth/login', { email, password });

export const addTransaction = (amount, text) =>
  api.post('/transactions', { amount, text });

export const getTransactions = (filters = {}) =>
  api.get('/transactions', { params: filters });

export const getInsights = () =>
  api.get('/insights');

export const getBestOffer = ({ amount, category, merchant, paymentType }) =>
  api.post('/offers/best', { amount, category, merchant, paymentType });
