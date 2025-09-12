// API configuration - Firebase backend with environment-based URLs
// Alternative endpoints for ERR_BLOCKED_BY_CLIENT resolution

// Determine API base URL based on environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
                    (import.meta.env.PROD 
                      ? 'https://cryptoportfolio-production.up.railway.app' // Production Railway URL
                      : getLocalApiUrl());

// Function to get local API URL with fallback options
function getLocalApiUrl() {
  // Get the current hostname/IP for mobile access
  const hostname = window.location.hostname;
  
  // If accessing via network IP (mobile), use that IP for backend
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `http://${hostname}:3001`;
  }
  
  // For localhost, prefer 127.0.0.1 to avoid ad blocker issues
  return 'http://127.0.0.1:3001';
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