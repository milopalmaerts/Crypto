// API Service with fallback for ERR_BLOCKED_BY_CLIENT issues
import { API_ENDPOINTS } from '@/config/api';
import { marketApi } from './marketApi';

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  source: 'backend' | 'direct' | 'mock';
}

class ApiService {
  private backendAvailable = true;
  private lastCheck = 0;
  private readonly CHECK_INTERVAL = 30000; // 30 seconds

  async getCoins<T>(): Promise<ApiResponse<T>> {
    // Try backend first if available
    if (await this.isBackendAvailable()) {
      try {
        const response = await fetch(API_ENDPOINTS.COINS, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
          const data = await response.json();
          return { data, error: null, source: 'backend' };
        }
      } catch (error) {
        console.warn('Backend API blocked or unavailable, falling back to direct API:', error);
        this.backendAvailable = false;
      }
    }

    // Fallback to direct CoinGecko API
    try {
      const data = await marketApi.getTopCoins(10);
      return { data: data as T, error: null, source: 'direct' };
    } catch (error) {
      console.error('Direct API also failed:', error);
      
      // Final fallback to mock data
      const mockData = this.getMockCoins();
      return { 
        data: mockData as T, 
        error: 'All APIs unavailable, showing mock data', 
        source: 'mock' 
      };
    }
  }

  async getCoinDetail<T>(id: string): Promise<ApiResponse<T>> {
    // Try backend first
    if (await this.isBackendAvailable()) {
      try {
        const response = await fetch(API_ENDPOINTS.COIN_DETAIL(id));
        if (response.ok) {
          const data = await response.json();
          return { data, error: null, source: 'backend' };
        }
      } catch (error) {
        console.warn('Backend blocked for coin detail, using direct API');
      }
    }

    // Fallback to direct API
    try {
      const data = await marketApi.getCoinDetail(id);
      return { data: data as T, error: null, source: 'direct' };
    } catch (error) {
      return { 
        data: null, 
        error: 'Failed to fetch coin details', 
        source: 'mock' 
      };
    }
  }

  async getChartData<T>(id: string, days: string): Promise<ApiResponse<T>> {
    // Try backend first
    if (await this.isBackendAvailable()) {
      try {
        const response = await fetch(API_ENDPOINTS.COIN_CHART(id, days));
        if (response.ok) {
          const data = await response.json();
          return { data, error: null, source: 'backend' };
        }
      } catch (error) {
        console.warn('Backend blocked for chart data, using direct API');
      }
    }

    // Fallback to direct API
    try {
      const data = await marketApi.getChartData(id, days);
      return { data: data as T, error: null, source: 'direct' };
    } catch (error) {
      return { 
        data: null, 
        error: 'Failed to fetch chart data', 
        source: 'mock' 
      };
    }
  }

  private async isBackendAvailable(): Promise<boolean> {
    const now = Date.now();
    
    // Don't check too frequently
    if (this.backendAvailable && (now - this.lastCheck) < this.CHECK_INTERVAL) {
      return true;
    }
    
    this.lastCheck = now;
    
    try {
      // Quick health check
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
      
      const response = await fetch(`${API_ENDPOINTS.BASE}/health`, {
        signal: controller.signal,
        method: 'GET',
      });
      
      clearTimeout(timeoutId);
      this.backendAvailable = response.ok;
      return this.backendAvailable;
    } catch (error) {
      this.backendAvailable = false;
      return false;
    }
  }

  private getMockCoins() {
    return [
      {
        id: 'bitcoin',
        name: 'Bitcoin',
        symbol: 'BTC',
        current_price: 45000,
        market_cap: 850000000000,
        price_change_percentage_24h: 2.5,
        image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png'
      },
      {
        id: 'ethereum',
        name: 'Ethereum',
        symbol: 'ETH',
        current_price: 3000,
        market_cap: 350000000000,
        price_change_percentage_24h: -1.2,
        image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png'
      }
    ];
  }

  // Reset backend availability (useful for manual retry)
  resetBackendStatus() {
    this.backendAvailable = true;
    this.lastCheck = 0;
    console.log('Backend availability status reset - will retry on next request');
  }
  
  // Get current backend status
  getBackendStatus() {
    return this.backendAvailable;
  }
  
  // Show user-friendly status message
  getStatusMessage(source: 'backend' | 'direct' | 'mock') {
    switch (source) {
      case 'backend':
        return 'Using server data';
      case 'direct':
        return 'Using real-time CoinGecko data';
      case 'mock':
        return 'Using sample data (APIs unavailable)';
      default:
        return 'Loading...';
    }
  }
}

export const apiService = new ApiService();
export default apiService;