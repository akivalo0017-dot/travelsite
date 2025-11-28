import pool from '../../../lib/mysql';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { userId, approve } = req.body;

        // Update user approval status
        await pool.execute(
            'UPDATE users SET is_approved = ? WHERE id = ?',
            [approve, userId]
        );

        res.status(200).json({
            success: true,
            message: `User ${approve ? 'approved' : 'rejected'} successfully`
        });

    } catch (error) {
        console.error('Admin approval error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}