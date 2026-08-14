const bcrypt = require('bcryptjs');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

async function createSuperAdmin() {
    console.log('🔧 Creating Super Admin...');
    
    // Super Admin details
    const admin = {
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

    // Hash password
    const password = 'Admin@123';
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(password, salt);

    // Read existing admins
    let admins = [];
    try {
        const data = fs.readFileSync('data/admins.json', 'utf8');
        admins = JSON.parse(data);
        console.log(`📁 Found ${admins.length} existing admin(s)`);
    } catch (error) {
        console.log('📁 No existing admins found, creating new file...');
    }

    // Check if admin already exists
    const existing = admins.find(a => a.email === admin.email);
    if (existing) {
        console.log('⚠️ Super Admin already exists!');
        console.log('📧 Email:', admin.email);
        console.log('🔑 Password: Admin@123');
        return;
    }

    // Add admin
    admins.push(admin);
    fs.writeFileSync('data/admins.json', JSON.stringify(admins, null, 2));

    console.log('');
    console.log('✅ Super Admin created successfully!');
    console.log('====================================');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Password: Admin@123');
    console.log('📋 Role:', admin.role);
    console.log('====================================');
    console.log('');
    console.log('💡 You can now start the backend and login!');
}

createSuperAdmin().catch(console.error);
