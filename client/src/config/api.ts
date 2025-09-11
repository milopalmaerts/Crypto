// API configuration - Now using Supabase for auth/data and direct CoinGecko for market data
// This file is maintained for backward compatibility during migration

// Supabase configuration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fnggwmxkdgwxsbjekics.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key-here';

// Legacy API endpoints (deprecated - use Supabase client instead)
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

// New Supabase configuration
export const SUPABASE_CONFIG = {
  URL: SUPABASE_URL,
  ANON_KEY: SUPABASE_ANON_KEY
};

export default API_BASE_URL;