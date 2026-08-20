const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const compression = require('compression');
const helmet = require('helmet');
require('dotenv').config();

// Import routes - ALL ROUTES
const authRoutes = require('./src/routes/auth');
const adminRoutes = require('./src/routes/admin');
const productRoutes = require('./src/routes/products');
const categoryRoutes = require('./src/routes/categories');
const applicationRoutes = require('./src/routes/applications');
const scannerRoutes = require('./src/routes/scanner');
const supplierRoutes = require('./src/routes/suppliers');
const repairRoutes = require('./src/routes/repairs');
const reviewRoutes = require('./src/routes/reviews');
const videoRoutes = require('./src/routes/videos');
const chatRoutes = require('./src/routes/chat');
const deliveryRoutes = require('./src/routes/delivery');
const paymentRoutes = require('./src/routes/payment');
const announcementRoutes = require('./src/routes/announcements');
const statsRoutes = require('./src/routes/stats');
const orderRoutes = require('./src/routes/orders');
const jobRoutes = require('./src/routes/jobs');
const cartRoutes = require('./src/routes/cart');
const customerCareRoutes = require('./src/routes/customer-care');
const uploadRoutes = require('./src/routes/upload');
const settingsRoutes = require('./src/routes/settings');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/data', express.static(path.join(__dirname, 'data')));

// Make io available in routes
app.set('io', io);

// Socket.io connections
require('./src/socket/chat')(io);
require('./src/socket/adminChat')(io);

// ===== ROUTES - ALL REGISTERED =====
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/scanner', scannerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/repairs', repairRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/customer-care', customerCareRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/settings', settingsRoutes);

// ===== HEALTH CHECK =====
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        routes: {
            total: 21,
            list: [
                '/api/auth',
                '/api/admin',
                '/api/products',
                '/api/categories',
                '/api/applications',
                '/api/scanner',
                '/api/suppliers',
                '/api/repairs',
                '/api/reviews',
                '/api/videos',
                '/api/chat',
                '/api/delivery',
                '/api/payment',
                '/api/announcements',
                '/api/stats',
                '/api/orders',
                '/api/jobs',
                '/api/cart',
                '/api/customer-care',
                '/api/upload',
                '/api/settings'
            ]
        }
    });
});

// ===== ROOT ROUTE - SHOWS ALL ENDPOINTS =====
app.get('/', (req, res) => {
    res.json({
        name: 'Modern Furniture Pacific API',
        version: '2.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        endpoints: {
            auth: '/api/auth',
            admin: '/api/admin',
            products: '/api/products',
            categories: '/api/categories',
            applications: '/api/applications',
            scanner: '/api/scanner',
            suppliers: '/api/suppliers',
            repairs: '/api/repairs',
            reviews: '/api/reviews',
            videos: '/api/videos',
            chat: '/api/chat',
            delivery: '/api/delivery',
            payment: '/api/payment',
            announcements: '/api/announcements',
            stats: '/api/stats',
            orders: '/api/orders',
            jobs: '/api/jobs',
            cart: '/api/cart',
            'customer-care': '/api/customer-care',
            upload: '/api/upload',
            settings: '/api/settings'
        },
        documentation: 'https://modern-furniture-api.onrender.com/api/health'
    });
});

// ===== 404 HANDLER =====
app.use((req, res) => {
    console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl,
        method: req.method,
        availableRoutes: [
            '/api/auth',
            '/api/admin',
            '/api/products',
            '/api/categories',
            '/api/applications',
            '/api/scanner',
            '/api/suppliers',
            '/api/repairs',
            '/api/reviews',
            '/api/videos',
            '/api/chat',
            '/api/delivery',
            '/api/payment',
            '/api/announcements',
            '/api/stats',
            '/api/orders',
            '/api/jobs',
            '/api/cart',
            '/api/customer-care',
            '/api/upload',
            '/api/settings'
        ]
    });
});

// ===== ERROR HANDLING =====
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// ===== SERVER START =====
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log('');
    console.log('🚀 Modern Pacific Furniture API');
    console.log(`📡 Server running on port ${PORT}`);
    console.log(`🔗 API URL: http://localhost:${PORT}/api`);
    console.log(`📱 Frontend URL: https://modern-furniture-pacific-ccnz.onrender.com`);
    console.log('');
    console.log('✅ System ready!');
    console.log('📋 Registered Routes:');
    console.log('   - /api/auth ✅');
    console.log('   - /api/admin ✅');
    console.log('   - /api/products ✅');
    console.log('   - /api/categories ✅');
    console.log('   - /api/applications ✅');
    console.log('   - /api/scanner ✅');
    console.log('   - /api/suppliers ✅');
    console.log('   - /api/repairs ✅');
    console.log('   - /api/reviews ✅');
    console.log('   - /api/videos ✅');
    console.log('   - /api/chat ✅');
    console.log('   - /api/delivery ✅');
    console.log('   - /api/payment ✅');
    console.log('   - /api/announcements ✅');
    console.log('   - /api/stats ✅');
    console.log('   - /api/orders ✅');
    console.log('   - /api/jobs ✅');
    console.log('   - /api/cart ✅');
    console.log('   - /api/customer-care ✅');
    console.log('   - /api/upload ✅');
    console.log('   - /api/settings ✅');
    console.log('');
    console.log('💡 All 21 routes registered successfully!');
});

module.exports = { app, io };