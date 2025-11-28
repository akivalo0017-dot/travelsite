// pages/api/test-db.js
import pool from '../../lib/mysql';

export default async function handler(req, res) {
    try {
        const [rows] = await pool.execute('SELECT 1 as test');
        res.status(200).json({ message: 'Database connected!', success: true });
    } catch (error) {
        res.status(500).json({ message: 'Database error: ' + error.message, success: false });
    }
}