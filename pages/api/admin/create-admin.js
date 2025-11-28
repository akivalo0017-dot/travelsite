// pages/api/admin/create-admin.js
import pool from '../../../lib/mysql';
import bcrypt from 'bcrypt';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { username, phone_number, password, full_name } = req.body;

        // Simple security check (you can enhance this)
        const secretKey = req.headers['x-admin-key'];
        if (secretKey !== 'CREATE_ADMIN_123') {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        if (!username || !phone_number || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username, phone number, and password are required'
            });
        }

        // Check if admin already exists
        const [existingAdmins] = await pool.execute(
            'SELECT id FROM users WHERE role = "admin"'
        );

        if (existingAdmins.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Admin account already exists'
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

        // Insert admin user
        const [result] = await pool.execute(
            `INSERT INTO users (username, phone_number, password, full_name, role, is_approved, invitation_code) 
       VALUES (?, ?, ?, ?, 'admin', true, 'ADMIN123')`,
            [username, phone_number, hashedPassword, full_name || username]
        );

        console.log(`Admin account created: ${username} (ID: ${result.insertId})`);

        res.status(201).json({
            success: true,
            message: 'Admin account created successfully',
            admin: {
                id: result.insertId,
                username: username,
                phone_number: phone_number,
                role: 'admin'
            }
        });

    } catch (error) {
        console.error('Create admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}