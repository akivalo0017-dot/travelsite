const { readData, writeData } = require('./utils/db');

console.log('🧪 Creating test user...');

// Read current users
let users = readData('users.json');
console.log('Current users:', users.length);

// Create test user
const testUser = {
    id: '999999',
    name: 'Test User',
    phone: '1234567890',
    password: 'hashed_password_123',
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

// Check if test user already exists
const existingUser = users.find(u => u.phone === testUser.phone);
if (!existingUser) {
    users.push(testUser);
    writeData('users.json', users);
    console.log('✅ Test user created:', testUser.name);
} else {
    console.log('ℹ️ Test user already exists');
}

// Verify
const updatedUsers = readData('users.json');
console.log('Users after creation:', updatedUsers.length);
updatedUsers.forEach(user => {
    console.log(`- ${user.name} (${user.phone}) - ${user.status}`);
});