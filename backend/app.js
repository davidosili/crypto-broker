const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const cookieParser = require('cookie-parser'); // ✅ Needed for sessions
const MongoStore = require('connect-mongo');

dotenv.config();

const app = express();

// ✅ Warm CoinGecko /markets cache at startup
async function warmCache() {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1');
    const data = await res.json();
    setCache('markets', data, 60_000); // Cache for 60s
    console.log('✅ Preloaded /markets cache');
  } catch (err) {
    console.error('❌ Failed to preload markets cache:', err);
  }
}

warmCache(); // Run once at startup
// Optional: refresh every 60 seconds
// setInterval(warmCache, 60_000); 

// ✅ CORS config - only local + Render frontends
app.use(cors({
  origin: [
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'https://krypt-broker-site.onrender.com',
    'https://krypt-broker.onrender.com'
  ],
  credentials: true
}));

// ✅ Parse cookies before sessions
app.use(cookieParser());

// ✅ Enable JSON parsing
app.use(express.json());

// ✅ Session config (secure for production, lax for local)
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  app.set('trust proxy', 1); // Required for secure cookies on Render
}

app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    ttl: 24 * 60 * 60 // 1 day
  }),
cookie: {
  httpOnly: true,
  secure: isProduction,          // Only secure in production
  sameSite: isProduction ? 'none' : 'lax',  // ✅ Lax for localhost, None for Render
  maxAge: 24 * 60 * 60 * 1000
}
}));


console.log('isProduction:', isProduction);

// ✅ Routes
const paymentRoutes = require('./routes/paymentRoutes');
const authRoutes = require('./routes/authRoutes');
const tradeRoutes = require('./routes/tradeRoutes');
const coinProxyRoutes = require('./routes/coinProxyRoutes');
const adminRoutes = require('./routes/adminRoutes');
const alertRoutes = require('./routes/alertRoutes');
const newsRoutes = require('./routes/newsRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/trade', tradeRoutes);
app.use('/api/coin', coinProxyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/copy', require('./routes/copyRoutes'));
app.use('/api/payment', paymentRoutes);

// ✅ Serve frontend statically
app.use('/frontend', express.static(path.join(__dirname, '../frontend')));

// ✅ Redirect root path to login page
app.get('/', (req, res) => {
  res.redirect('/frontend/index.html');
});

// ✅ Start background jobs
require('./jobs/priceAlertJob');

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);

      // 🔄 Keep Render service awake by pinging itself every 14 minutes
      const fetch = require('node-fetch');
      const SELF_URL = 'https://krypt-broker.onrender.com'; // your Render URL

      setInterval(() => {
        fetch(SELF_URL)
          .then(res => console.log(`Self-ping status: ${res.status}`))
          .catch(err => console.error('Self-ping failed:', err));
      }, 14 * 60 * 1000); // every 14 min
    });
  })
  .catch(err => console.error('MongoDB connection error:', err));
