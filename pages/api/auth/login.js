// pages/api/auth/login.js - UPDATED FOR PHONE NUMBER
import pool from '../../../lib/mysql';
import bcrypt from 'bcrypt';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { phone_number, password } = req.body;

        if (!phone_number || !password) {
            return res.status(400).json({
                success: false,
                message: 'Phone number and password are required'
            });
        }

        // Find user by phone number
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE phone_number = ?',
            [phone_number]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid phone number or password'
            });
        }

        const user = users[0];

        // Check if approved
        if (!user.is_approved && user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: 'Account pending admin approval'
            });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid phone number or password'
            });
        }

        // Return user data (excluding password)
        const { password: _, ...userWithoutPassword } = user;

        res.status(200).json({
            success: true,
            message: 'Login successful',
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}