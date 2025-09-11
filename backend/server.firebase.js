
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.COINGECKO_API_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Initialize Firebase Admin SDK
let serviceAccount = null;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (err) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT env var. Make sure it is a JSON string.');
  }
}

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Initialized Firebase Admin with provided service account.');
} else {
  try {
    admin.initializeApp();
    console.log('Initialized Firebase Admin with default credentials.');
  } catch (err) {
    console.warn('Firebase Admin could not be initialized with default credentials. Provide FIREBASE_SERVICE_ACCOUNT env var.');
  }
}

const db = admin.firestore();

app.use(cors());
app.use(express.json());

// JWT authentication middleware
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

// Helper: find user by email
const findUserByEmail = async (email) => {
  const snapshot = await db.collection('users').where('email', '==', email).limit(1).get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
};

// Helper: create new user
const createUser = async (firstName, lastName, email, passwordHash) => {
  const id = crypto.randomUUID();
  const data = {
    first_name: firstName,
    last_name: lastName,
    email: email,
    password_hash: passwordHash,
    created_at: admin.firestore.FieldValue.serverTimestamp(),
    updated_at: admin.firestore.FieldValue.serverTimestamp()
  };
  await db.collection('users').doc(id).set(data);
  return { id, ...data };
};

// Helper: get holdings by user
const getHoldingsByUser = async (userId) => {
  const snapshot = await db.collection('holdings').where('user_id', '==', userId).orderBy('created_at', 'asc').get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Helper: find existing holding by user and crypto_id
const findHolding = async (userId, crypto_id) => {
  const snapshot = await db.collection('holdings').where('user_id', '==', userId).where('crypto_id', '==', crypto_id).limit(1).get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
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

    await db.collection('holdings').doc(existing.id).update({
      amount: newTotalAmount,
      avg_price: newAvgPrice,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    return { id: existing.id, crypto_id, symbol, name, amount: newTotalAmount, avg_price: newAvgPrice };
  } else {
    const docRef = db.collection('holdings').doc();
    const docData = {
      user_id: userId,
      crypto_id,
      symbol,
      name,
      amount: parseFloat(amount),
      avg_price: parseFloat(avgPrice),
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };
    await docRef.set(docData);
    return { id: docRef.id, ...docData };
  }
};

// Helper: delete holding by crypto_id and user
const deleteHoldingByCryptoId = async (userId, crypto_id) => {
  const snapshot = await db.collection('holdings').where('user_id', '==', userId).where('crypto_id', '==', crypto_id).get();
  if (snapshot.empty) return 0;
  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  return snapshot.size;
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

    // Generate JWT token
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

    // Generate JWT token
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
      currentPrice: 0 // Will be updated by frontend
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

app.get('/api/news', (req, res) => {
    const mockNews = [
        { title: "Bitcoin hits new high", timestamp: "2025-09-08", source: "MockCryptoNews" },
        { title: "Ethereum upgrade delayed", timestamp: "2025-09-07", source: "MockCryptoNews" },
        { title: "Altcoins rally 15%", timestamp: "2025-09-06", source: "MockCryptoNews" }
    ];
    res.json(mockNews);
});

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
// Start server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
