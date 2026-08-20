const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Ensure data directory exists
if (!fs.existsSync('data')) {
    fs.mkdirSync('data', { recursive: true });
}

// Seed categories
const categories = [
    { id: uuidv4(), name: 'Bedroom', description: 'Elegant bedroom furniture', icon: 'bed', image: 'bedroom.jpg' },
    { id: uuidv4(), name: 'Dining', description: 'Beautiful dining sets', icon: 'utensils', image: 'dining.jpg' },
    { id: uuidv4(), name: 'Sitting Room', description: 'Comfortable seating', icon: 'sofa', image: 'sitting-room.jpg' },
    { id: uuidv4(), name: 'Balcony', description: 'Outdoor furniture', icon: 'tree', image: 'balcony.jpg' },
    { id: uuidv4(), name: 'Office', description: 'Professional office furniture', icon: 'briefcase', image: 'office.jpg' }
];

// Seed products
const products = [
    {
        id: uuidv4(),
        name: 'Mahogany Bed',
        description: 'Elegant mahogany bed with modern design',
        price: 85000,
        category: 'Bedroom',
        images: ['mahogany-bed-1.jpg', 'mahogany-bed-2.jpg'],
        stock: 10,
        status: 'available',
        dimensions: { width: 180, height: 200, depth: 100 },
        materials: ['Mahogany wood', 'Leather', 'Metal'],
        colors: ['Brown', 'Dark Brown'],
        branch: 'all',
        isFeatured: true,
        has360View: true,
        ratings: { average: 4.5, count: 12 },
        createdAt: new Date().toISOString()
    },
    {
        id: uuidv4(),
        name: 'Modern Dining Table',
        description: '6-seater dining table with glass top',
        price: 65000,
        category: 'Dining',
        images: ['dining-table-1.jpg', 'dining-table-2.jpg'],
        stock: 8,
        status: 'available',
        dimensions: { width: 200, height: 75, depth: 100 },
        materials: ['Glass', 'Metal'],
        colors: ['Black', 'Silver'],
        branch: 'all',
        isFeatured: true,
        has360View: true,
        ratings: { average: 4.8, count: 8 },
        createdAt: new Date().toISOString()
    },
    {
        id: uuidv4(),
        name: 'Luxury Sofa Set',
        description: 'Premium leather sofa set with 3+2+1 seating',
        price: 120000,
        category: 'Sitting Room',
        images: ['sofa-set-1.jpg', 'sofa-set-2.jpg'],
        stock: 5,
        status: 'available',
        dimensions: { width: 300, height: 90, depth: 100 },
        materials: ['Leather', 'Wood', 'Foam'],
        colors: ['Brown', 'Black', 'White'],
        branch: 'all',
        isFeatured: true,
        has360View: true,
        ratings: { average: 4.9, count: 15 },
        createdAt: new Date().toISOString()
    }
];

// Write seed data
fs.writeFileSync('data/categories.json', JSON.stringify(categories, null, 2));
fs.writeFileSync('data/products.json', JSON.stringify(products, null, 2));
fs.writeFileSync('data/users.json', JSON.stringify([], null, 2));
fs.writeFileSync('data/admins.json', JSON.stringify([], null, 2));
fs.writeFileSync('data/orders.json', JSON.stringify([], null, 2));
fs.writeFileSync('data/applications.json', JSON.stringify([], null, 2));
fs.writeFileSync('data/scanner-measurements.json', JSON.stringify([], null, 2));
fs.writeFileSync('data/suppliers.json', JSON.stringify([], null, 2));
fs.writeFileSync('data/repairs.json', JSON.stringify([], null, 2));
fs.writeFileSync('data/reviews.json', JSON.stringify([], null, 2));
fs.writeFileSync('data/videos.json', JSON.stringify([], null, 2));
fs.writeFileSync('data/chat.json', JSON.stringify([], null, 2));
fs.writeFileSync('data/admin-chat.json', JSON.stringify([], null, 2));
fs.writeFileSync('data/deliveries.json', JSON.stringify([], null, 2));
fs.writeFileSync('data/payments.json', JSON.stringify([], null, 2));
fs.writeFileSync('data/announcements.json', JSON.stringify([], null, 2));
fs.writeFileSync('data/notifications.json', JSON.stringify([], null, 2));
fs.writeFileSync('data/settings.json', JSON.stringify({
    applications: {
        isOpen: false,
        openDate: null,
        closeDate: null,
        message: 'Applications are currently closed. Please check back for future openings.'
    },
    maintenance: {
        enabled: false
    }
}, null, 2));

console.log('✅ Database seeded successfully!');
console.log('📁 Categories:', categories.length);
console.log('📁 Products:', products.length);
console.log('💡 Run node create-super-admin.js to create the Super Admin');