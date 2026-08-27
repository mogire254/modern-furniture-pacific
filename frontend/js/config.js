// ============================================
// COMPLETE API CONFIGURATION - 100 YEAR TOKEN
// ============================================

// API URL - Render Backend
const API_URL = 'https://modern-furniture-api.onrender.com/api';

// WebSocket URL for real-time chat
const WS_URL = 'wss://modern-furniture-api.onrender.com';

// Token Configuration - 100 Years!
const TOKEN_CONFIG = {
    expiry: '100y',        // 100 years - never expires!
    storageKey: 'token',
    userKey: 'user',
    expiryKey: 'tokenExpiry'
};

// Company Contact Info
const COMPANY_INFO = {
    hotline: '0716 335555',
    email: 'info@modernfurniturepacificltd.com',
    phone: '0748486829',
    whatsapp: '0716 335555',
    location: 'Ruiru, Behind Spur Mall',
    hoursWeek: '9:00AM - 10:00PM',
    hoursSun: '10:00AM - 6:00PM'
};

// ===== CORRECT API ENDPOINTS =====
const API_ENDPOINTS = {
    // Auth
    login: `${API_URL}/auth/login`,
    register: `${API_URL}/auth/register`,
    me: `${API_URL}/auth/me`,
    profile: `${API_URL}/auth/profile`,
    
    // Products
    products: `${API_URL}/products`,
    featuredProducts: `${API_URL}/products/featured`,
    product: (id) => `${API_URL}/products/${id}`,
    productStatus: (id) => `${API_URL}/products/${id}/status`,
    productNotify: (id) => `${API_URL}/products/${id}/notify`,
    
    // Categories
    categories: `${API_URL}/categories`,
    
    // Jobs (Applications)
    jobs: `${API_URL}/jobs`,
    jobApply: (id) => `${API_URL}/jobs/${id}/apply`,
    jobApplicants: (id) => `${API_URL}/jobs/${id}/applicants`,
    
    // Suppliers
    suppliers: `${API_URL}/suppliers`,
    supplierSubmit: `${API_URL}/suppliers/submit`,
    supplierApprove: (id) => `${API_URL}/suppliers/${id}/approve`,
    
    // Repairs
    repairs: `${API_URL}/repairs`,
    repairSubmit: `${API_URL}/repairs/submit`,
    repairUpdate: (id) => `${API_URL}/repairs/${id}`,
    
    // Reviews
    reviews: `${API_URL}/reviews`,
    reviewSubmit: `${API_URL}/reviews/submit`,
    reviewApprove: (id) => `${API_URL}/reviews/${id}/approve`,
    reviewReject: (id) => `${API_URL}/reviews/${id}/reject`,
    
    // Videos
    videos: `${API_URL}/videos`,
    videoLike: (id) => `${API_URL}/videos/${id}/like`,
    videoView: (id) => `${API_URL}/videos/${id}/view`,
    
    // Customer Care
    customerCare: `${API_URL}/customer-care`,
    customerCareSend: `${API_URL}/customer-care/send`,
    customerCareMy: `${API_URL}/customer-care/my`,
    customerCareAll: `${API_URL}/customer-care/all`,
    customerCareReply: (userId) => `${API_URL}/customer-care/reply/${userId}`,
    customerCareClose: (userId) => `${API_URL}/customer-care/close/${userId}`,
    
    // Orders
    orders: `${API_URL}/orders`,
    ordersMy: `${API_URL}/orders/my`,
    orderCreate: `${API_URL}/orders/create`,
    orderStatus: (id) => `${API_URL}/orders/${id}/status`,
    orderPayment: (id) => `${API_URL}/orders/${id}/payment`,
    orderCancel: (id) => `${API_URL}/orders/${id}/cancel`,
    
    // Cart
    cart: `${API_URL}/cart`,
    cartAdd: `${API_URL}/cart/add`,
    cartRemove: (productId) => `${API_URL}/cart/remove/${productId}`,
    cartClear: `${API_URL}/cart/clear`,
    
    // Delivery
    delivery: `${API_URL}/delivery`,
    deliveryMy: `${API_URL}/delivery/my`,
    deliveryStatus: (id) => `${API_URL}/delivery/${id}/status`,
    
    // Payment
    payment: `${API_URL}/payment`,
    paymentMy: `${API_URL}/payment/my`,
    paymentInitiate: `${API_URL}/payment/initiate`,
    
    // Admin
    admin: `${API_URL}/admin`,
    adminUsers: `${API_URL}/admin/users`,
    adminStats: `${API_URL}/admin/stats`,
    adminBranches: `${API_URL}/admin/branches`,
    
    // Stats
    stats: `${API_URL}/stats`,
    
    // Announcements
    announcements: `${API_URL}/announcements`,
    
    // Upload
    upload: `${API_URL}/upload`,
    uploadSingle: `${API_URL}/upload/single`,
    uploadMultiple: `${API_URL}/upload/multiple`,
    
    // Health
    health: `${API_URL}/health`
};

console.log('✅ API_URL configured:', API_URL);
console.log('✅ 100-year token configured');
console.log('✅ API Endpoints loaded');