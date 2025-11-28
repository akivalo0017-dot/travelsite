const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'data');
const usersFile = path.join(dataPath, 'users.json');

// Create data directory if it doesn't exist
if (!fs.existsSync(dataPath)) {
  fs.mkdirSync(dataPath);
}

// Read existing users
let users = [];
if (fs.existsSync(usersFile)) {
  users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
}

// Create admin user
const createAdmin = async () => {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const adminUser = {
    id: 'admin-' + Date.now().toString(),
    name: 'Administrator',
    phone: '1234567890',
    password: hashedPassword,
    role: 'admin',
    status: 'approved',
    createdAt: new Date().toISOString(),
    wallet: {
      taskCount: 0,
      bonusPoints: 0,
      pointBalance: 0,
      pendingPoints: 0,
      todayPoints: 0
    }
  };

  users.push(adminUser);
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
  console.log('Admin user created successfully!');
  console.log('Phone: 1234567890');
  console.log('Password: admin123');
};

createAdmin();