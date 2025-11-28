const { readData, writeData } = require('./utils/db');

console.log('🧪 Testing wallet system...');

// Test 1: Check if users file exists and has data
const users = readData('users.json');
console.log('📊 Current users:', users.length);

if (users.length > 0) {
    console.log('👥 Users found:');
    users.forEach(user => {
        console.log(`- ${user.name} (${user.phone}):`, user.wallet || 'No wallet');
    });

    // Test 2: Try to update a user's wallet
    const testUser = users[0];
    if (testUser) {
        console.log(`\n🔄 Testing wallet update for ${testUser.name}...`);

        if (!testUser.wallet) {
            testUser.wallet = {
                taskCount: 0,
                bonusPoints: 1000,
                pointBalance: 0,
                pendingPoints: 0,
                todayPoints: 0
            };
        }

        const oldBalance = testUser.wallet.pointBalance;
        testUser.wallet.pointBalance = 5000;

        writeData('users.json', users);

        // Verify update
        const updatedUsers = readData('users.json');
        const updatedUser = updatedUsers.find(u => u.id === testUser.id);
        console.log(`✅ Wallet update test: ${oldBalance} → ${updatedUser.wallet.pointBalance}`);
    }
} else {
    console.log('❌ No users found. Please register a user first.');
}

console.log('🧪 Test completed!');