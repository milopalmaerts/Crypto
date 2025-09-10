const express = require('express');
const axios = require('axios');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.COINGECKO_API_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Rate limiting variables
let lastApiCall = 0;
const RATE_LIMIT_DELAY = 12000; // 12 seconds between API calls (even more conservative)
const requestQueue = [];
let isProcessingQueue = false;
let consecutiveFailures = 0;
const MAX_CONSECUTIVE_FAILURES = 1; // Trigger cooldown after just 1 failure

// Emergency cooldown when we get failures
let isInCooldown = false;
const COOLDOWN_DURATION = 60000; // 60 seconds cooldown after failures (doubled)

// In-memory cache to reduce API calls
const cache = {
  coins: new Map(),
  charts: new Map()
};
const CACHE_DURATION = 300000; // 5 minutes cache

// Helper function to get cached data
const getCachedData = (key, cacheMap) => {
  const cached = cacheMap.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`Returning cached data for ${key}`);
    return cached.data;
  }
  return null;
};

// Helper function to set cached data
const setCachedData = (key, data, cacheMap) => {
  cacheMap.set(key, {
    data,
    timestamp: Date.now()
  });
};
const getMockChartData = (id, days) => {
  const points = days === '1' ? 24 : days === '7' ? 7 : days === '30' ? 30 : days === '365' ? 365 : 30;
  const basePrice = id === 'bitcoin' ? 110000 : id === 'ethereum' ? 4000 : 2000;
  
  const data = [];
  for (let i = 0; i < points; i++) {
    const timestamp = Date.now() - (points - i) * 24 * 60 * 60 * 1000;
    const price = basePrice + (Math.random() - 0.5) * basePrice * 0.1; // ±10% variation
    data.push({
      timestamp,
      price,
      date: new Date(timestamp).toLocaleDateString()
    });
  }
  
  return { data, period: days };
};

const getMockCoinData = (id) => {
  return {
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    symbol: id.toUpperCase(),
    market_data: {
      current_price: { usd: id === 'bitcoin' ? 110000 : id === 'ethereum' ? 4000 : 2000 },
      market_cap: { usd: 2000000000000 },
      market_cap_rank: 1,
      price_change_percentage_24h: Math.random() * 10 - 5
    },
    description: { en: `${id.charAt(0).toUpperCase() + id.slice(1)} is a cryptocurrency.` },
    image: {
      large: `https://assets.coingecko.com/coins/images/1/${id}.png`
    }
  };
};

// Enhanced request queue system with emergency cooldown
const processQueue = async () => {
  if (isProcessingQueue || requestQueue.length === 0) return;
  
  // Check if we're in emergency cooldown
  if (isInCooldown) {
    console.log('API is in emergency cooldown, rejecting request');
    // Reject all queued requests during cooldown
    while (requestQueue.length > 0) {
      const { reject } = requestQueue.shift();
      reject(new Error('API in emergency cooldown'));
    }
    return;
  }
  
  isProcessingQueue = true;
  
  while (requestQueue.length > 0) {
    const { resolve, reject, apiCall } = requestQueue.shift();
    
    try {
      await delayApiCall();
      const result = await apiCall();
      consecutiveFailures = 0; // Reset failure count on success
      resolve(result);
    } catch (error) {
      if (error.response?.status === 429) {
        consecutiveFailures++;
        console.log(`Rate limit error ${consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES}`);
        
        // Trigger emergency cooldown if any failures
        if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
          console.log('Rate limit failure detected, entering emergency cooldown for 60 seconds');
          isInCooldown = true;
          setTimeout(() => {
            isInCooldown = false;
            consecutiveFailures = 0;
            console.log('Emergency cooldown ended, API requests resumed');
          }, COOLDOWN_DURATION);
        }
      }
      reject(error);
    }
  }
  
  isProcessingQueue = false;
};

// Helper function to queue API calls
const queueApiCall = (apiCall) => {
  return new Promise((resolve, reject) => {
    requestQueue.push({ resolve, reject, apiCall });
    processQueue();
  });
};

// Helper function to delay API calls with progressive backoff
const delayApiCall = async () => {
  const now = Date.now();
  const timeSinceLastCall = now - lastApiCall;
  
  // Much more aggressive delay based on failure count
  const baseDelay = RATE_LIMIT_DELAY;
  const failureMultiplier = Math.pow(2, consecutiveFailures); // 1, 2, 4, 8...
  const currentDelay = Math.min(baseDelay * failureMultiplier, 60000); // Max 60 seconds
  
  if (timeSinceLastCall < currentDelay) {
    const delayTime = currentDelay - timeSinceLastCall;
    console.log(`Rate limiting: waiting ${delayTime}ms (failures: ${consecutiveFailures}) before next API call`);
    await new Promise(resolve => setTimeout(resolve, delayTime));
  }
  lastApiCall = Date.now();
};

app.use(cors({
  origin: ['http://localhost:80', 'http://localhost:8080', 'http://localhost:8081', 'http://localhost:8082', 'http://localhost:8083', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

// Database setup
const dbPath = path.join(__dirname, 'crypto_portfolio.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating users table:', err.message);
    } else {
      console.log('Users table ready');
    }
  });

  // Check if holdings table exists and has user_id column
  db.get("PRAGMA table_info(holdings)", (err, result) => {
    if (err) {
      console.error('Error checking holdings table:', err.message);
      return;
    }
    
    // If table doesn't exist, create it with user_id
    if (!result) {
      db.run(`
        CREATE TABLE holdings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL DEFAULT 1,
          crypto_id TEXT NOT NULL,
          symbol TEXT NOT NULL,
          name TEXT NOT NULL,
          amount REAL NOT NULL,
          avg_price REAL NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `, (err) => {
        if (err) {
          console.error('Error creating holdings table:', err.message);
        } else {
          console.log('Holdings table created with user_id column');
        }
      });
    } else {
      // Table exists, check if it has user_id column
      db.all("PRAGMA table_info(holdings)", (err, columns) => {
        if (err) {
          console.error('Error checking holdings columns:', err.message);
          return;
        }
        
        const hasUserId = columns.some(col => col.name === 'user_id');
        
        if (!hasUserId) {
          console.log('Adding user_id column to existing holdings table');
          db.run('ALTER TABLE holdings ADD COLUMN user_id INTEGER NOT NULL DEFAULT 1', (err) => {
            if (err) {
              console.error('Error adding user_id column:', err.message);
            } else {
              console.log('Holdings table updated with user_id column');
            }
          });
        } else {
          console.log('Holdings table ready with user_id column');
        }
      });
    }
  });
}

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Endpoint: User Registration
app.post('/api/auth/register', async (req, res) => {
  console.log('POST /api/auth/register');
  const { firstName, lastName, email, password } = req.body;
  
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  try {
    // Check if user already exists
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, row) => {
      if (err) {
        console.error('Error checking existing user:', err.message);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (row) {
        return res.status(400).json({ error: 'User already exists with this email' });
      }
      
      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      
      // Insert new user
      db.run(
        'INSERT INTO users (first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?)',
        [firstName, lastName, email, passwordHash],
        function(err) {
          if (err) {
            console.error('Error creating user:', err.message);
            return res.status(500).json({ error: 'Failed to create user' });
          }
          
          // Generate JWT token
          const token = jwt.sign(
            { userId: this.lastID, email: email },
            JWT_SECRET,
            { expiresIn: '24h' }
          );
          
          console.log(`New user registered: ${email}`);
          res.json({
            message: 'User created successfully',
            token: token,
            user: {
              id: this.lastID,
              firstName: firstName,
              lastName: lastName,
              email: email
            }
          });
        }
      );
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint: User Login
app.post('/api/auth/login', (req, res) => {
  console.log('POST /api/auth/login');
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      console.error('Error finding user:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    try {
      // Compare password
      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      console.log(`User logged in: ${email}`);
      res.json({
        message: 'Login successful',
        token: token,
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
});
app.get('/api/portfolio', authenticateToken, (req, res) => {
  console.log('GET /api/portfolio');
  const userId = req.user.userId;
  
  db.all('SELECT * FROM holdings WHERE user_id = ? ORDER BY created_at ASC', [userId], (err, rows) => {
    if (err) {
      console.error('Error fetching portfolio:', err.message);
      res.status(500).json({ error: 'Failed to fetch portfolio' });
      return;
    }
    
    const holdings = rows.map(row => ({
      id: row.crypto_id,
      symbol: row.symbol,
      name: row.name,
      amount: row.amount,
      avgPrice: row.avg_price,
      currentPrice: 0 // Will be updated by frontend
    }));
    
    res.json(holdings);
  });
});

// Endpoint: Add new holding (protected)
app.post('/api/portfolio', authenticateToken, (req, res) => {
  console.log('POST /api/portfolio');
  const { crypto_id, symbol, name, amount, avgPrice } = req.body;
  const userId = req.user.userId;
  
  if (!crypto_id || !symbol || !name || !amount || !avgPrice) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // Check if holding already exists for this user
  db.get('SELECT * FROM holdings WHERE crypto_id = ? AND user_id = ?', [crypto_id, userId], (err, row) => {
    if (err) {
      console.error('Error checking existing holding:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (row) {
      // Update existing holding (average the prices and sum amounts)
      const newTotalAmount = row.amount + amount;
      const newAvgPrice = ((row.amount * row.avg_price) + (amount * avgPrice)) / newTotalAmount;
      
      db.run(
        'UPDATE holdings SET amount = ?, avg_price = ?, updated_at = CURRENT_TIMESTAMP WHERE crypto_id = ? AND user_id = ?',
        [newTotalAmount, newAvgPrice, crypto_id, userId],
        function(err) {
          if (err) {
            console.error('Error updating holding:', err.message);
            return res.status(500).json({ error: 'Failed to update holding' });
          }
          
          console.log(`Updated holding for ${symbol}: ${newTotalAmount} at avg price ${newAvgPrice}`);
          res.json({ 
            message: 'Holding updated successfully',
            id: crypto_id,
            symbol,
            name,
            amount: newTotalAmount,
            avgPrice: newAvgPrice
          });
        }
      );
    } else {
      // Insert new holding
      db.run(
        'INSERT INTO holdings (user_id, crypto_id, symbol, name, amount, avg_price) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, crypto_id, symbol, name, amount, avgPrice],
        function(err) {
          if (err) {
            console.error('Error inserting holding:', err.message);
            return res.status(500).json({ error: 'Failed to add holding' });
          }
          
          console.log(`Added new holding: ${symbol} - ${amount} at ${avgPrice}`);
          res.json({ 
            message: 'Holding added successfully',
            id: crypto_id,
            symbol,
            name,
            amount,
            avgPrice
          });
        }
      );
    }
  });
});

// Endpoint: Delete holding (protected)
app.delete('/api/portfolio/:crypto_id', authenticateToken, (req, res) => {
  console.log('DELETE /api/portfolio/' + req.params.crypto_id);
  const { crypto_id } = req.params;
  const userId = req.user.userId;
  
  db.run('DELETE FROM holdings WHERE crypto_id = ? AND user_id = ?', [crypto_id, userId], function(err) {
    if (err) {
      console.error('Error deleting holding:', err.message);
      return res.status(500).json({ error: 'Failed to delete holding' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Holding not found' });
    }
    
    console.log(`Deleted holding: ${crypto_id}`);
    res.json({ message: 'Holding deleted successfully' });
  });
});

// Endpoint: lijst van top coins
app.get('/api/coins', async (req, res) => {
  try {
    console.log('Queueing coins request from CoinGecko');
    
    const result = await queueApiCall(async () => {
      console.log('Fetching coins from CoinGecko');
      
      // Build the API URL
      const apiUrl = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false';
      
      // Headers object for potential API key
      const headers = {};
      
      // Only add API key if it's properly configured (not the placeholder)
      if (API_KEY && API_KEY !== 'your_api_key_here') {
        headers['x-cg-demo-api-key'] = API_KEY;
      }
      
      const response = await axios.get(apiUrl, { headers });
      return response.data.map(coin => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol.toUpperCase(),
        current_price: coin.current_price,
        market_cap: coin.market_cap,
        price_change_percentage_24h: coin.price_change_percentage_24h,
        image: coin.image
      }));
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching coins from CoinGecko:', error.message);
    
    // Only use mock data after multiple consecutive failures
    if (error.response?.status === 429 && consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      console.log('Multiple rate limit failures, returning mock coins data temporarily');
      const mockCoins = [
        { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', current_price: 110000, market_cap: 2000000000000, price_change_percentage_24h: 2.5, image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png' },
        { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', current_price: 4000, market_cap: 500000000000, price_change_percentage_24h: 1.8, image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png' },
        { id: 'cardano', name: 'Cardano', symbol: 'ADA', current_price: 2.5, market_cap: 100000000000, price_change_percentage_24h: -0.5, image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png' },
        { id: 'solana', name: 'Solana', symbol: 'SOL', current_price: 200, market_cap: 80000000000, price_change_percentage_24h: 3.2, image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png' }
      ];
      res.json(mockCoins);
      return;
    }
    
    // For occasional rate limits, return error to allow retry
    if (error.response?.status === 429) {
      console.log('Rate limited by CoinGecko API, client should retry');
      res.status(429).json({ error: 'Rate limited by external API. Please try again later.' });
    } else {
      res.status(500).json({ error: 'Failed to fetch coin data' });
    }
  }
});

// Endpoint: historische data voor een coin
app.get('/api/coin/:id/chart', async (req, res) => {
  const { id } = req.params;
  const { days = '7' } = req.query; // Default to 7 days
  
  // Map time periods to CoinGecko API days parameter
  const timeMap = {
    '1': '1',      // 1 day
    '7': '7',      // 1 week
    '30': '30',    // 1 month
    '365': '365',  // 1 year
    'max': 'max'   // All time
  };
  
  const validDays = timeMap[days] || '7';
  
  try {
    console.log('Queueing chart request for', id, 'with period', validDays);
    
    const result = await queueApiCall(async () => {
      console.log('Fetching chart for', id, 'with period', validDays, 'from CoinGecko');
      
      // Build the API URL
      let apiUrl = `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${validDays}`;
      
      // Headers object for potential API key
      const headers = {};
      
      // Only add API key if it's properly configured (not the placeholder)
      if (API_KEY && API_KEY !== 'your_api_key_here') {
        headers['x-cg-demo-api-key'] = API_KEY;
      }
      
      const response = await axios.get(apiUrl, { headers });
      
      // Transform the data to include timestamps for better chart display
      const chartData = response.data.prices.map(([timestamp, price]) => ({
        timestamp,
        price,
        date: new Date(timestamp).toLocaleDateString()
      }));
      
      return { data: chartData, period: validDays };
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching chart for', id, 'with period', validDays, ':', error.message);
    
    // Only use mock data after multiple consecutive failures
    if (error.response?.status === 429 && consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      console.log('Multiple rate limit failures, returning mock chart data temporarily');
      const mockData = getMockChartData(id, validDays);
      res.json(mockData);
      return;
    }
    
    // For occasional rate limits, return error to allow retry
    if (error.response?.status === 429) {
      console.log('Rate limited by CoinGecko API for chart data, client should retry');
      res.status(429).json({ error: 'Rate limited by external API. Please try again later.' });
      return;
    }
    
    // If max period fails, try with 365 days as fallback
    if (validDays === 'max') {
      try {
        console.log('Max period failed, trying 365 days as fallback...');
        const fallbackResult = await queueApiCall(async () => {
          const fallbackUrl = `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=365`;
          const headers = {};
          
          if (API_KEY && API_KEY !== 'your_api_key_here') {
            headers['x-cg-demo-api-key'] = API_KEY;
          }
          
          const fallbackResponse = await axios.get(fallbackUrl, { headers });
          const chartData = fallbackResponse.data.prices.map(([timestamp, price]) => ({
            timestamp,
            price,
            date: new Date(timestamp).toLocaleDateString()
          }));
          
          return { data: chartData, period: '365' };
        });
        
        res.json(fallbackResult);
        return;
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError.message);
        if (fallbackError.response?.status === 429) {
          res.status(429).json({ error: 'Rate limited by external API. Please try again later.' });
          return;
        }
      }
    }
    
    res.status(500).json({ error: 'Failed to fetch chart data' });
  }
});

// Endpoint: mock nieuws
app.get('/api/news', (req, res) => {
    const mockNews = [
        { title: "Bitcoin hits new high", timestamp: "2025-09-08", source: "MockCryptoNews" },
        { title: "Ethereum upgrade delayed", timestamp: "2025-09-07", source: "MockCryptoNews" },
        { title: "Altcoins rally 15%", timestamp: "2025-09-06", source: "MockCryptoNews" }
    ];
    res.json(mockNews);
});

// Endpoint: coin details
app.get('/api/coin/:id', async (req, res) => {
  const { id } = req.params;
  try {
    console.log('Queueing coin details request for', id);
    
    const result = await queueApiCall(async () => {
      console.log('Fetching coin details for', id, 'from CoinGecko');
      
      const apiUrl = `https://api.coingecko.com/api/v3/coins/${id}`;
      const headers = {};
      
      if (API_KEY && API_KEY !== 'your_api_key_here') {
        headers['x-cg-demo-api-key'] = API_KEY;
      }
      
      const response = await axios.get(apiUrl, { headers });
      return response.data;
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching coin', id, ':', error.message);
    
    // Only use mock data after multiple consecutive failures
    if (error.response?.status === 429 && consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      console.log('Multiple rate limit failures, returning mock coin data temporarily');
      const mockData = getMockCoinData(id);
      res.json(mockData);
      return;
    }
    
    // For occasional rate limits, return error to allow retry
    if (error.response?.status === 429) {
      console.log('Rate limited by CoinGecko API for coin details, client should retry');
      res.status(429).json({ error: 'Rate limited by external API. Please try again later.' });
    } else {
      res.status(500).json({ error: 'Failed to fetch coin data' });
    }
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.send('CryptoTracker Backend is running');
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
