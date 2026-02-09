import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000, // 10 seconds timeout
  withCredentials: true, // Enable credentials for cross-origin requests
});

// Attach JWT token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const signup = (email, password, name) =>
  api.post('/auth/signup', { email, password, name });

export const login = (email, password) =>
  api.post('/auth/login', { email, password });

export const verifyOtp = ({ email, otp }) =>
  api.post('/auth/verify-otp', { email, otp });

export const resendOtp = ({ email }) =>
  api.post('/auth/request-otp', { email });

export const googleLogin = ({ idToken }) =>
  api.post('/auth/google', { idToken });

export const addTransaction = (amount, text, category) =>
  api.post('/transactions', { amount, text, category });

export const getTransactions = (filters = {}) =>
  api.get('/transactions', { params: filters });

export const getInsights = () =>
  api.get('/insights');

// ... existing exports

export const getProfile = () =>
  api.get('/auth/me');

export const updateProfile = (data) =>
  api.put('/auth/me', data);

export const logout = () => {
  localStorage.removeItem('token');
  window.location.href = '/'; // Hard redirect to ensure state clear
};

export const getBestOffer = ({ amount, category, merchant, paymentType }) =>
  api.post('/offers/best', { amount, category, merchant, paymentType });

export const useOffer = ({ amount, category, merchant, card_name, offer_id, decision, ignored_offer, missed_saving_amount, recommended_card }) =>
  api.post('/offers/use', { amount, category, merchant, card_name, offer_id, decision, ignored_offer, missed_saving_amount, recommended_card });

export const getDashboardData = async () => {
  const [totalExpense, category, daily, weekly, monthly, behavior, savings] = await Promise.all([
    api.get('/insights/total'),
    api.get('/insights/category'),
    api.get('/insights/daily'),
    api.get('/insights/weekly'),
    api.get('/insights/monthly'),
    api.get('/insights/behavior'),
    api.get('/insights/savings')
  ]);
  return {
    totalExpense: totalExpense.data.totalExpense,
    bankName: totalExpense.data.bankName,
    availableBalance: totalExpense.data.availableBalance,
    category: category.data,
    daily: daily.data,
    weekly: weekly.data,
    monthly: monthly.data,
    behavior: behavior.data,
    totalSavings: savings.data.totalSavings
  };
};

export const getSavings = async () => {
  const res = await api.get('/insights/savings');
  return res.data;
};

export const getCards = () =>
  api.get('/cards');

export const addCard = (cardData) =>
  api.post('/cards', cardData);

export const getGoals = () => api.get("/goals");
export const createGoal = (goalData) => api.post("/goals", goalData);
export const getGoalProgress = (month) => api.get('/goals/progress', { params: { month } });

export const createCategoryGoal = (goalData) => api.post("/goals/category", goalData);
export const getCategoryGoals = () => api.get("/goals/category");

// SMS
export const ingestSMS = (text) => api.post("/sms/ingest", { sms_body: text });

export const getSmartScore = () =>
  api.get('/insights/score');


export const getLinkToken = (userId) => api.post('/plaid/link-token', { userId }); // Placeholder if needed

export const sendChatMessage = (message) => api.post('/chat', { message });

