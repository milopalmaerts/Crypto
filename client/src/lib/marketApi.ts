// Direct CoinGecko API integration (bypassing backend)
const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

export interface CoinMarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
}

export interface CoinDetail {
  id: string;
  name: string;
  symbol: string;
  market_data: {
    current_price: { usd: number };
    market_cap: { usd: number };
    market_cap_rank: number;
    price_change_percentage_24h: number;
  };
  description: { en: string };
  image: { large: string };
}

export interface ChartDataPoint {
  timestamp: number;
  price: number;
  date: string;
}

export interface ChartResponse {
  data: ChartDataPoint[];
  period: string;
}

// Market data API functions
export const marketApi = {
  async getTopCoins(limit = 100): Promise<CoinMarketData[]> {
    try {
      const response = await fetch(
        `${COINGECKO_BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching market data:', error);
      // Return mock data as fallback
      return getMockMarketData();
    }
  },

  async getCoinDetail(id: string): Promise<CoinDetail> {
    try {
      const response = await fetch(
        `${COINGECKO_BASE_URL}/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching coin detail:', error);
      // Return mock data as fallback
      return getMockCoinDetail(id);
    }
  },

  async getChartData(id: string, days: string): Promise<ChartResponse> {
    try {
      let period = days;
      
      // Handle 'max' period - CoinGecko might reject this, so we'll use a fallback
      if (days === 'max') {
        period = '365'; // Fallback to 1 year for max
      }

      const response = await fetch(
        `${COINGECKO_BASE_URL}/coins/${id}/market_chart?vs_currency=usd&days=${period}`
      );

      if (!response.ok) {
        // If request fails and it was for 'max', try with 365 days
        if (days === 'max') {
          console.warn('Max period failed, falling back to 365 days');
          return this.getChartData(id, '365');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform the data to match our interface
      const transformedData = data.prices.map((price: [number, number]) => ({
        timestamp: price[0],
        price: price[1],
        date: new Date(price[0]).toLocaleDateString()
      }));

      return {
        data: transformedData,
        period: days
      };
    } catch (error) {
      console.error('Error fetching chart data:', error);
      // Return mock data as fallback
      return getMockChartData(id, days);
    }
  }
};

// Mock data functions for fallbacks
function getMockMarketData(): CoinMarketData[] {
  return [
    {
      id: 'bitcoin',
      symbol: 'btc',
      name: 'Bitcoin',
      image: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
      current_price: 45000,
      market_cap: 850000000000,
      market_cap_rank: 1,
      price_change_percentage_24h: 2.5
    },
    {
      id: 'ethereum',
      symbol: 'eth',
      name: 'Ethereum',
      image: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
      current_price: 3000,
      market_cap: 350000000000,
      market_cap_rank: 2,
      price_change_percentage_24h: -1.2
    }
  ];
}

function getMockCoinDetail(id: string): CoinDetail {
  const basePrice = id === 'bitcoin' ? 45000 : id === 'ethereum' ? 3000 : 1000;
  
  return {
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    symbol: id.toUpperCase(),
    market_data: {
      current_price: { usd: basePrice },
      market_cap: { usd: basePrice * 19000000 },
      market_cap_rank: id === 'bitcoin' ? 1 : id === 'ethereum' ? 2 : 10,
      price_change_percentage_24h: (Math.random() - 0.5) * 10
    },
    description: { 
      en: `${id.charAt(0).toUpperCase() + id.slice(1)} is a popular cryptocurrency.` 
    },
    image: { 
      large: `https://assets.coingecko.com/coins/images/1/${id}.png` 
    }
  };
}

function getMockChartData(id: string, days: string): ChartResponse {
  const points = days === '1' ? 24 : days === '7' ? 7 : days === '30' ? 30 : 365;
  const basePrice = id === 'bitcoin' ? 45000 : id === 'ethereum' ? 3000 : 1000;
  
  const data = [];
  for (let i = 0; i < points; i++) {
    const timestamp = Date.now() - (points - i) * 24 * 60 * 60 * 1000;
    const price = basePrice + (Math.random() - 0.5) * basePrice * 0.1;
    data.push({
      timestamp,
      price,
      date: new Date(timestamp).toLocaleDateString()
    });
  }
  
  return { data, period: days };
}