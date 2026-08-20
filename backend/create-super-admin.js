const bcrypt = require('bcryptjs');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

async function createSuperAdmin() {
    console.log('🔧 Creating Super Admin...');
    console.log('=' .repeat(50));
    
    const admin = {
        id: uuidv4(),
        name: 'Super Admin',
        email: 'superadmin@modernfurniturepacific.com',
        password: null, // Will be hashed
        role: 'super_admin',
        branch: 'all',
        phone: '+254 700 123 456',
        profileImage: 'avatar-default.png',
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
    const filePath = 'data/admins.json';
    
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            admins = JSON.parse(data);
            console.log(`📁 Found ${admins.length} existing admin(s)`);
        } else {
            console.log('📁 No existing admins found, creating new file...');
            // Ensure data directory exists
            if (!fs.existsSync('data')) {
                fs.mkdirSync('data', { recursive: true });
            }
        }
    } catch (error) {
        console.log('📁 No existing admins found, creating new file...');
    }

    // Check if admin already exists
    const existing = admins.find(a => a.email === admin.email);
    if (existing) {
        console.log('⚠️ Super Admin already exists!');
        console.log('📧 Email:', admin.email);
        console.log('🔑 Password: Admin@123');
        console.log('=' .repeat(50));
        return;
    }

    // Add admin
    admins.push(admin);
    fs.writeFileSync(filePath, JSON.stringify(admins, null, 2));

    console.log('');
    console.log('✅ Super Admin created successfully!');
    console.log('=' .repeat(50));
    console.log('📧 Email:', admin.email);
    console.log('🔑 Password: Admin@123');
    console.log('📋 Role:', admin.role);
    console.log('🏢 Branch:', admin.branch);
    console.log('=' .repeat(50));
    console.log('');
    console.log('💡 You can now start the backend and login!');
    console.log('💡 Use these credentials to access the admin dashboard.');
}

createSuperAdmin().catch(console.error);