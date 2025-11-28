const { readData, writeData } = require('./db');

// Simple hash function (same as above)
const simpleHash = (password) => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
};

const createAdmin = () => {
  const users = readData('users.json');
  
  // Check if admin already exists
  const existingAdmin = users.find(user => user.role === 'admin');
  if (existingAdmin) {
    console.log('Admin user already exists!');
    return;
  }

  const adminUser = {
    id: 'admin-' + Date.now().toString(),
    name: 'Administrator',
    phone: '1234567890',
    password: simpleHash('admin123'),
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
  writeData('users.json', users);
  
  console.log('Admin user created successfully!');
  console.log('Phone: 1234567890');
  console.log('Password: admin123');
  console.log('You can now login to the admin panel.');
};

createAdmin();