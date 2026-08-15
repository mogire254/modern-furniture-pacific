const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./src/routes/auth');
// ... (all your other route imports remain the same)

const app = express();

// ===== CORS CONFIGURATION =====
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== ✅ NEW: ROOT ROUTE (Add this here) =====
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Modern Furniture Pacific API is running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      categories: '/api/categories',
      orders: '/api/orders',
      cart: '/api/cart',
      reviews: '/api/reviews',
      applications: '/api/applications',
      suppliers: '/api/suppliers',
      repairs: '/api/repairs',
      admins: '/api/admins',
      chat: '/api/chat',
      health: '/api/health'
    }
  });
});

// ===== API ROUTES (Your existing routes) =====
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
// ... (all your other app.use routes remain the same)

// Health check (keep this too)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Modern Furniture Pacific API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handler (keep this at the end)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Something went wrong!'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔓 CORS: All origins allowed`);
});