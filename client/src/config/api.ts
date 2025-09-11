// API configuration - Firebase backend with environment-based URLs
// Alternative endpoints for ERR_BLOCKED_BY_CLIENT resolution

// Determine API base URL based on environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
                    (import.meta.env.PROD 
                      ? 'https://cryptoportfolio-production.up.railway.app' // Production Railway URL
                      : getLocalApiUrl());

// Function to get local API URL with fallback options
function getLocalApiUrl() {
  // Try multiple localhost alternatives for ERR_BLOCKED_BY_CLIENT issues
  const alternatives = [
    'http://127.0.0.1:3001',  // Numeric IP often bypasses ad blockers
    'http://localhost:3001',   // Standard localhost
  ];
  
  // In development, try 127.0.0.1 first as it often bypasses ad blockers
  return alternatives[0];
}

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