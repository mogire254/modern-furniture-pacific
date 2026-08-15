const fs = require('fs');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function seedAdmins() {
    const filePath = 'data/admins.json';
    let admins = [];
    
    if (fs.existsSync(filePath)) {
        try {
            const data = fs.readFileSync(filePath, 'utf8');
            admins = JSON.parse(data);
        } catch (e) {
            console.log('Error reading admins.json, creating new file');
        }
    }
    
    if (admins.length === 0) {
        console.log('📝 Seeding default admin accounts...');
        
        const superAdmin = {
            id: uuidv4(),
            name: 'Super Admin',
            email: 'superadmin@modernfurniturepacific.com',
            role: 'super_admin',
            branch: 'all',
            phone: '+254 700 123 456',
            isActive: true,
            createdAt: new Date().toISOString(),
            lastLogin: null
        };
        superAdmin.password = await bcrypt.hash('Admin@123', 10);
        admins.push(superAdmin);
        
        const ceoAdmin = {
            id: uuidv4(),
            name: 'CEO Admin',
            email: 'ceo@modernfurniturepacific.com',
            role: 'ceo_admin',
            branch: 'all',
            phone: '+254 700 123 457',
            isActive: true,
            createdAt: new Date().toISOString(),
            lastLogin: null
        };
        ceoAdmin.password = await bcrypt.hash('Admin@123', 10);
        admins.push(ceoAdmin);
        
        fs.writeFileSync(filePath, JSON.stringify(admins, null, 2));
        console.log('✅ Default admins seeded successfully!');
    } else {
        console.log(`✅ Found ${admins.length} existing admin(s)`);
    }
}

seedAdmins().catch(console.error);