import { readData, writeData } from '../../../utils/db';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { name, phone, password } = req.body;

  // Read existing users
  const users = readData('users.json');

  // Check if user already exists
  const existingUser = users.find(user => user.phone === phone);
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists' });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create new user
  const newUser = {
    id: Date.now().toString(),
    name,
    phone,
    password: hashedPassword,
    status: 'pending', // pending, approved, frozen
    createdAt: new Date().toISOString(),
    wallet: {
      taskCount: 0,
      bonusPoints: 0,
      pointBalance: 0,
      pendingPoints: 0,
      todayPoints: 0
    }
  };

  users.push(newUser);
  writeData('users.json', users);

  res.status(201).json({ message: 'User registered successfully' });
}