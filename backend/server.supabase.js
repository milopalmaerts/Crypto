const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.COINGECKO_API_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'r7/LwJlBdFI4pyK8V1IPigoI4Xz2RD1imHmHui7nyy9+6pdfC5Ke+btFobPIY9Np+0KKUGXKfBCkiobn6ZroHw==';

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://fnggwmxkdgwxsbjekics.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Rate limiting variables
let consecutiveFailures = 0;
const MAX_CONSECUTIVE_FAILURES = 2;
const queue = [];
let isProcessing = false;

// Cache for API responses
const cache = new Map();
const CACHE_DURATION = 30000; // 30 seconds

// Helper function to get cached data
const getCachedData = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

// Helper function to set cached data
const setCachedData = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() });
};

// Queue for API calls to prevent rate limiting
const queueApiCall = async (apiCall) => {
  return new Promise((resolve, reject) => {
    queue.push({ apiCall, resolve, reject });
    processQueue();
  });
};

const processQueue = async () => {
  if (isProcessing || queue.length === 0) return;
  
  isProcessing = true;
  const { apiCall, resolve, reject } = queue.shift();
  
  try {
    const result = await apiCall();
    consecutiveFailures = 0;
    resolve(result);
  } catch (error) {
    if (error.response?.status === 429) {
      consecutiveFailures++;
    }
    reject(error);
  } finally {
    isProcessing = false;
    setTimeout(() => processQueue(), 1000);
  }
};

// Mock data functions
const getMockChartData = (id, days) => {
  const points = days === '1' ? 24 : days === '7' ? 7 : days === '30' ? 30 : 365;
  const basePrice = id === 'bitcoin' ? 45000 : id === 'ethereum' ? 3000 : 1000;
  
  const data = [];
  const now = Date.now();
  const interval = days === '1' ? 3600000 : 86400000;
  
  for (let i = 0; i < points; i++) {
    const timestamp = now - (points - i - 1) * interval;
    const variance = (Math.random() - 0.5) * 0.1;
    const price = basePrice * (1 + variance);
    
    data.push({
      timestamp,
      price,
      date: new Date(timestamp).toLocaleDateString()
    });
  }
  
  return { data, period: days };
};

const getMockCoinData = (id) => {
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
};

// Enhanced CORS configuration for development and production
const corsOptions = {
  origin: function (origin, callback) {
    console.log('CORS check for origin:', origin);
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      console.log('No origin - allowing');
      return callback(null, true);
    }
    
    const allowedOrigins = [
      'http://localhost:8082',
      'http://localhost:8083',
      'http://localhost:3000',
      'http://127.0.0.1:8082',
      'http://127.0.0.1:8083',
      'http://127.0.0.1:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://192.168.0.131:8082', // Network IP for mobile access
      'http://192.168.0.131:8083',
      'http://192.168.11.1:8082',
      'http://192.168.11.1:8083',
      'http://192.168.170.1:8082',
      'http://192.168.170.1:8083',
      'https://cryptoportfolio-psi.vercel.app' // Production frontend
    ];
    
    // Allow Railway domains
    if (origin.includes('.railway.app')) {
      console.log('Railway domain - allowing');
      return callback(null, true);
    }
    
    // Allow Vercel domains
    if (origin.includes('.vercel.app')) {
      console.log('Vercel domain - allowing');
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      console.log('Origin in allowed list - allowing');
      return callback(null, true);
    }
    
    console.log('Origin not allowed:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Add explicit preflight handling
app.options('*', cors(corsOptions));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'EindRersult Backend (Supabase)',
    database: 'Supabase Connected',
    cors: 'Enabled'
  });
});

// JWT authentication middleware
const authenticateToken = (req, res, next) => {
  console.log('Auth middleware called for:', req.method, req.path);
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  console.log('Token received:', token ? 'Yes' : 'No');

  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log('JWT verification error:', err.message);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    console.log('JWT verified successfully for user:', user.userId);
    req.user = user;
    next();
  });
};

// Helper: find user by email
const findUserByEmail = async (email) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    throw error;
  }
  
  return data;
};

// Helper: create new user
const createUser = async (firstName, lastName, email, passwordHash) => {
  const id = crypto.randomUUID();
  const { data, error } = await supabase
    .from('users')
    .insert({
      id,
      first_name: firstName,
      last_name: lastName,
      email: email,
      password_hash: passwordHash,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Helper: get holdings by user
const getHoldingsByUser = async (userId) => {
  const { data, error } = await supabase
    .from('holdings')
    .select('*')
    .eq('user_id', userId);
  
  if (error) throw error;
  return data || [];
};

// Helper: find existing holding by user and crypto_id
const findHolding = async (userId, crypto_id) => {
  const { data, error } = await supabase
    .from('holdings')
    .select('*')
    .eq('user_id', userId)
    .eq('crypto_id', crypto_id)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    throw error;
  }
  
  return data;
};

// Helper: add or update holding
const addOrUpdateHolding = async (userId, crypto_id, symbol, name, amount, avgPrice) => {
  const existing = await findHolding(userId, crypto_id);
  
  if (existing) {
    const prevAmount = parseFloat(existing.amount || 0);
    const prevAvg = parseFloat(existing.avg_price || 0);
    const addAmount = parseFloat(amount);
    const addAvg = parseFloat(avgPrice);
    const newTotalAmount = prevAmount + addAmount;
    const newAvgPrice = newTotalAmount > 0 ? ((prevAmount * prevAvg) + (addAmount * addAvg)) / newTotalAmount : addAvg;

    const { data, error } = await supabase
      .from('holdings')
      .update({
        amount: newTotalAmount,
        avg_price: newAvgPrice,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('holdings')
      .insert({
        user_id: userId,
        crypto_id,
        symbol,
        name,
        amount: parseFloat(amount),
        avg_price: parseFloat(avgPrice),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Helper: delete holding by crypto_id and user
const deleteHoldingByCryptoId = async (userId, crypto_id) => {
  const { data, error } = await supabase
    .from('holdings')
    .delete()
    .eq('user_id', userId)
    .eq('crypto_id', crypto_id);

  if (error) throw error;
  return data?.length || 0;
};

// Endpoint: User Registration
app.post('/api/auth/register', async (req, res) => {
  console.log('POST /api/auth/register');
  const { firstName, lastName, email, password } = req.body;
  
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const newUser = await createUser(firstName, lastName, email, passwordHash);

    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(`New user registered: ${email}`);
    res.json({
      message: 'User created successfully',
      token: token,
      user: {
        id: newUser.id,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        email: newUser.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint: User Login
app.post('/api/auth/login', async (req, res) => {
  console.log('POST /api/auth/login');
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const userDoc = await findUserByEmail(email);
    if (!userDoc) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordMatch = await bcrypt.compare(password, userDoc.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: userDoc.id, email: userDoc.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(`User logged in: ${email}`);
    res.json({
      message: 'Login successful',
      token: token,
      user: {
        id: userDoc.id,
        firstName: userDoc.first_name,
        lastName: userDoc.last_name,
        email: userDoc.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint: Get portfolio (protected)
app.get('/api/portfolio', authenticateToken, async (req, res) => {
  console.log('GET /api/portfolio');
  const userId = req.user.userId;

  try {
    const holdings = await getHoldingsByUser(userId);

    const formattedHoldings = holdings.map(row => ({
      id: row.crypto_id,
      symbol: row.symbol,
      name: row.name,
      amount: parseFloat(row.amount),
      avgPrice: parseFloat(row.avg_price),
      currentPrice: 0
    }));

    res.json(formattedHoldings);
  } catch (error) {
    console.error('Portfolio fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint: Add new holding (protected)
app.post('/api/portfolio', authenticateToken, async (req, res) => {
  console.log('POST /api/portfolio');
  const { crypto_id, symbol, name, amount, avgPrice } = req.body;
  const userId = req.user.userId;
  
  if (!crypto_id || !symbol || !name || !amount || !avgPrice) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await addOrUpdateHolding(userId, crypto_id, symbol, name, amount, avgPrice);
    res.json({ message: 'Holding added/updated', holding: result });
  } catch (error) {
    console.error('Portfolio add error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint: Delete holding (protected)
app.delete('/api/portfolio/:crypto_id', authenticateToken, async (req, res) => {
  const crypto_id = req.params.crypto_id;
  const userId = req.user.userId;
  console.log('DELETE /api/portfolio/' + crypto_id);

  try {
    const deletedCount = await deleteHoldingByCryptoId(userId, crypto_id);
    if (deletedCount === 0) {
      return res.status(404).json({ error: 'Holding not found' });
    }
    res.json({ message: 'Holding deleted' });
  } catch (error) {
    console.error('Error deleting holding:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoints for coins, charts, news remain the same...
app.get('/api/coins', async (req, res) => {
  try {
    console.log('Checking cache for coins data');
    
    const cacheKey = 'coins';
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      console.log('Returning cached coins data');
      return res.json(cachedData);
    }
    
    console.log('Queueing coins request from CoinGecko');
    
    const result = await queueApiCall(async () => {
      console.log('Fetching coins from CoinGecko');
      
      const apiUrl = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false';
      const headers = {};
      
      if (API_KEY && API_KEY !== 'your_api_key_here') {
        headers['x-cg-demo-api-key'] = API_KEY;
      }
      
      const response = await axios.get(apiUrl, { headers });
      const coinsData = response.data.map(coin => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol.toUpperCase(),
        current_price: coin.current_price,
        market_cap: coin.market_cap,
        price_change_percentage_24h: coin.price_change_percentage_24h,
        image: coin.image
      }));
      
      setCachedData(cacheKey, coinsData);
      return coinsData;
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching coins from CoinGecko:', error.message);
    
    if (error.response?.status === 429 && consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      console.log('Multiple rate limit failures, returning mock coins data temporarily');
      const mockCoins = [
        { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', current_price: 110000, market_cap: 2000000000000, price_change_percentage_24h: 2.5, image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png' },
        { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', current_price: 4000, market_cap: 500000000000, price_change_percentage_24h: 1.8, image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png' }
      ];
      res.json(mockCoins);
      return;
    }
    
    if (error.response?.status === 429) {
      console.log('Rate limited by CoinGecko API, client should retry');
      res.status(429).json({ error: 'Rate limited by external API. Please try again later.' });
    } else {
      res.status(500).json({ error: 'Failed to fetch coin data' });
    }
  }
});

// Other endpoints (chart, coin details, news) remain the same...
app.get('/api/coin/:id/chart', async (req, res) => {
  const { id } = req.params;
  const { days = '7' } = req.query;
  
  const timeMap = {
    '1': '1',
    '7': '7',
    '30': '30',
    '365': '365',
    'max': 'max'
  };
  
  const validDays = timeMap[days] || '7';
  
  try {
    const cacheKey = `chart-${id}-${validDays}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    const result = await queueApiCall(async () => {
      let apiUrl = `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${validDays}`;
      const headers = {};
      
      if (API_KEY && API_KEY !== 'your_api_key_here') {
        headers['x-cg-demo-api-key'] = API_KEY;
      }
      
      const response = await axios.get(apiUrl, { headers });
      
      const chartData = response.data.prices.map(([timestamp, price]) => ({
        timestamp,
        price,
        date: new Date(timestamp).toLocaleDateString()
      }));
      
      const result = { data: chartData, period: validDays };
      setCachedData(cacheKey, result);
      return result;
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching chart:', error.message);
    if (error.response?.status === 429 && consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      const mockData = getMockChartData(id, validDays);
      res.json(mockData);
      return;
    }
    
    if (error.response?.status === 429) {
      res.status(429).json({ error: 'Rate limited by external API. Please try again later.' });
      return;
    }
    
    res.status(500).json({ error: 'Failed to fetch chart data' });
  }
});

app.get('/api/coin/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const cacheKey = `coin-${id}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    const result = await queueApiCall(async () => {
      const apiUrl = `https://api.coingecko.com/api/v3/coins/${id}`;
      const headers = {};
      
      if (API_KEY && API_KEY !== 'your_api_key_here') {
        headers['x-cg-demo-api-key'] = API_KEY;
      }
      
      const response = await axios.get(apiUrl, { headers });
      setCachedData(cacheKey, response.data);
      return response.data;
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching coin:', error.message);
    
    if (error.response?.status === 429 && consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      const mockData = getMockCoinData(id);
      res.json(mockData);
      return;
    }
    
    if (error.response?.status === 429) {
      res.status(429).json({ error: 'Rate limited by external API. Please try again later.' });
    } else {
      res.status(500).json({ error: 'Failed to fetch coin data' });
    }
  }
});

app.get('/api/news', (req, res) => {
  const mockNews = [
    { title: "Bitcoin hits new high", timestamp: "2025-09-08", source: "MockCryptoNews" },
    { title: "Ethereum upgrade delayed", timestamp: "2025-09-07", source: "MockCryptoNews" },
    { title: "Altcoins rally 15%", timestamp: "2025-09-06", source: "MockCryptoNews" }
  ];
  res.json(mockNews);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log('Using Supabase database at:', supabaseUrl);
});