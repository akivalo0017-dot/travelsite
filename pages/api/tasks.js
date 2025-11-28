import { query } from '../../lib/db';

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            const tasks = await query(`
        SELECT t.*, up.completion_count, up.is_completed 
        FROM tasks t 
        LEFT JOIN user_progress up ON t.id = up.task_id AND up.user_id = ?
        WHERE t.is_active = TRUE 
        ORDER BY t.position
      `, [req.userId]); // You'll need to add authentication middleware

            res.status(200).json(tasks);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}