// pages/api/auth/register.js - UPDATED FOR PHONE NUMBER
import pool from '../../../lib/mysql';
import bcrypt from 'bcrypt';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { username, phone_number, password, invitation_code } = req.body;

        // Validate required fields
        if (!username || !phone_number || !password || !invitation_code) {
            return res.status(400).json({
                message: 'Username, phone number, password, and invitation code are required'
            });
        }

        // Check if phone number already exists
        const [existingUsers] = await pool.execute(
            'SELECT id FROM users WHERE phone_number = ?',
            [phone_number]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({
                message: 'User with this phone number already exists'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Insert new user
        const [result] = await pool.execute(
            `INSERT INTO users (username, phone_number, password, full_name, invitation_code, role, is_approved, wallet_balance, current_set, current_task) 
       VALUES (?, ?, ?, ?, ?, 'user', FALSE, 0.00, 1, 1)`,
            [username, phone_number, hashedPassword, username, invitation_code]
        );

        // Create initial user progress for regular tasks
        const userId = result.insertId;

        // Get all regular tasks to create initial progress records
        const [regularTasks] = await pool.execute(
            `SELECT id, set_number, task_number FROM tasks 
       WHERE task_type = 'regular' AND is_active = TRUE 
       ORDER BY set_number, task_number`
        );

        // Create progress entries for each regular task
        if (regularTasks.length > 0) {
            const progressValues = regularTasks.map(task =>
                [userId, task.id, task.set_number, task.number, 0, false, null]
            );

            const progressQuery = `
        INSERT INTO user_progress 
        (user_id, task_id, set_number, task_number, completion_count, is_completed, completed_at) 
        VALUES ?
      `;

            await pool.query(progressQuery, [progressValues]);
        }

        res.status(201).json({
            success: true,
            message: 'User registered successfully. Waiting for admin approval.',
            userId: userId
        });

    } catch (error) {
        console.error('Registration error:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'User with this phone number already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error during registration'
        });
    }
}