// API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export const API_ENDPOINTS = {
  BASE: API_BASE_URL,
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
  },
  PORTFOLIO: `${API_BASE_URL}/api/portfolio`,
  COINS: `${API_BASE_URL}/api/coins`,
  COIN_DETAIL: (id: string) => `${API_BASE_URL}/api/coin/${id}`,
  COIN_CHART: (id: string, days: string) => `${API_BASE_URL}/api/coin/${id}/chart?days=${days}`,
  NEWS: `${API_BASE_URL}/api/news`,
};

export default API_BASE_URL;