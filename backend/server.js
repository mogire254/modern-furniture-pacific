const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

// Import routes
const scannerRoutes = require('./src/routes/scanner');
const customerCareRoutes = require('./src/routes/customer-care');
const chatRoutes = require('./src/routes/chat');
const adminRoutes = require('./src/routes/admin');
const authRoutes = require('./src/routes/auth');
const productRoutes = require('./src/routes/products');
const categoryRoutes = require('./src/routes/categories');
const orderRoutes = require('./src/routes/orders');
const cartRoutes = require('./src/routes/cart');
const reviewRoutes = require('./src/routes/reviews');
const applicationRoutes = require('./src/routes/applications');
const supplierRoutes = require('./src/routes/suppliers');
const repairRoutes = require('./src/routes/repairs');

const app = express();

// ===== CORS CONFIGURATION - FIXED =====
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== API ROUTES =====
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/repairs', repairRoutes);
app.use("/api/scanner", scannerRoutes);
app.use("/api/customer-care", customerCareRoutes);
app.use('/api/admins', adminRoutes);   // ✅ Added for admin management
app.use('/api/chat', chatRoutes);      // ✅ Added for admin chat

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Modern Furniture Pacific API is running locally',
    timestamp: new Date().toISOString()
  });
});

// Error handler
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
  console.log(`🔓 CORS: All origins allowed (development mode)`);
});