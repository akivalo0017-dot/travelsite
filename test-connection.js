const mysql = require('mysql2/promise');

async function testConnection() {
    const config = {
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'travelsite',
        port: 3306
    };

    try {
        console.log('🔌 Testing MySQL connection...');

        const connection = await mysql.createConnection(config);
        console.log('✅ Connected to MySQL successfully!');

        // Test query
        const [rows] = await connection.execute('SELECT COUNT(*) as count FROM users');
        console.log(`📊 Users in database: ${rows[0].count}`);

        // Test tasks query
        const [tasks] = await connection.execute('SELECT COUNT(*) as count FROM tasks');
        console.log(`📋 Tasks in database: ${tasks[0].count}`);

        await connection.end();
        console.log('🔚 Connection closed.');

    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        console.log('\n🔧 Troubleshooting tips:');
        console.log('1. Make sure XAMPP MySQL is running');
        console.log('2. Check if database "travelsite" exists');
        console.log('3. Verify username/password in config');
        console.log('4. Check if port 3306 is available');
    }
}

testConnection();