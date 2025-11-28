import pool from '../../../lib/mysql';
import bcrypt from 'bcrypt';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { username, phone_number, password, invitation_code } = req.body;

    if (!username || !phone_number || !password || !invitation_code) {
      return res.status(400).json({ 
        success: false,
        message: 'All fields are required' 
      });
    }

    // Check if phone number exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE phone_number = ?',
      [phone_number]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Phone number already registered' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Insert user
    const [result] = await pool.execute(
      `INSERT INTO users (username, phone_number, password, full_name, invitation_code, role, is_approved) 
       VALUES (?, ?, ?, ?, ?, 'user', FALSE)`,
      [username, phone_number, hashedPassword, username, invitation_code]
    );

    res.status(201).json({ 
      success: true,
      message: 'Registration successful! Waiting for admin approval.',
      userId: result.insertId
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error'
    });
  }
}
