const { readData, writeData } = require('./utils/db');

console.log('🧪 Testing user registration and admin display...');

// Test 1: Check current users
const users = readData('users.json');
console.log('📊 Current users in database:', users.length);

if (users.length > 0) {
    console.log('👥 Users found:');
    users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.phone}) - Status: ${user.status} - ID: ${user.id}`);
        console.log('   Wallet:', user.wallet || 'No wallet');
    });
} else {
    console.log('❌ No users found. Testing registration...');

    // Create a test user
    const testUser = {
        id: '123456',
        name: 'Test User',
        phone: '1234567890',
        password: 'hashed_password',
        status: 'pending',
        role: 'user',
        createdAt: new Date().toISOString(),
        wallet: {
            taskCount: 0,
            bonusPoints: 10000,
            pointBalance: 0,
            pendingPoints: 0,
            todayPoints: 0
        }
    };

    users.push(testUser);
    writeData('users.json', users);
    console.log('✅ Test user created');
}

// Test 2: Check if admin can read users
console.log('\n🧪 Testing admin user retrieval...');
const adminUsers = readData('users.json');
const usersForAdmin = adminUsers.map(({ password, ...user }) => {
    if (!user.wallet) {
        user.wallet = {
            taskCount: 0,
            bonusPoints: 1000,
            pointBalance: 0,
            pendingPoints: 0,
            todayPoints: 0
        };
    }
    return user;
});

console.log('📋 Users ready for admin panel:', usersForAdmin.length);
usersForAdmin.forEach(user => {
    console.log(`- ${user.name} (${user.status}) - Balance: ₹${user.wallet.pointBalance}`);
});

console.log('🧪 User test completed!');