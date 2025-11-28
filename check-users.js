const { readData } = require('./utils/db');

console.log('🔍 Checking users data...');

// Check users.json
const users = readData('users.json');
console.log('📊 Users in database:', users.length);

if (users.length > 0) {
    console.log('👥 Users found:');
    users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.phone}) - Status: ${user.status} - ID: ${user.id}`);
        console.log('   Wallet:', user.wallet || 'No wallet');
    });
} else {
    console.log('❌ No users found in database');
}

// Check data directory
const fs = require('fs');
const path = require('path');
const dataPath = path.join(process.cwd(), 'data');

console.log('\n📁 Data directory contents:');
if (fs.existsSync(dataPath)) {
    const files = fs.readdirSync(dataPath);
    files.forEach(file => {
        const filePath = path.join(dataPath, file);
        const stats = fs.statSync(filePath);
        console.log(`- ${file} (${stats.size} bytes)`);
    });
} else {
    console.log('❌ Data directory does not exist');
}