import pool from '../../../lib/mysql';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const userId = req.query.userId; // In real app, get from session/auth

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        // Get user basic info
        const [users] = await pool.execute(
            `SELECT id, email, full_name, wallet_balance, current_set, current_task 
       FROM users WHERE id = ?`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = users[0];

        // Get user progress with task details
        const [progress] = await pool.execute(
            `SELECT 
        up.*,
        t.title,
        t.description,
        t.task_type,
        t.reward_amount,
        t.required_completion
       FROM user_progress up
       JOIN tasks t ON up.task_id = t.id
       WHERE up.user_id = ?
       ORDER BY up.set_number, up.task_number`,
            [userId]
        );

        // Get available tasks for current progression
        const [availableTasks] = await pool.execute(
            `SELECT t.* 
       FROM tasks t
       WHERE t.set_number = ? AND t.task_number = ? AND t.is_active = TRUE
       AND NOT EXISTS (
         SELECT 1 FROM user_progress up 
         WHERE up.user_id = ? AND up.task_id = t.id AND up.is_completed = TRUE
       )`,
            [user.current_set, user.current_task, userId]
        );

        // Get completed tasks count for stats
        const [stats] = await pool.execute(
            `SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN is_completed = TRUE THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN is_completed = TRUE THEN t.reward_amount ELSE 0 END) as total_earned
       FROM user_progress up
       JOIN tasks t ON up.task_id = t.id
       WHERE up.user_id = ?`,
            [userId]
        );

        res.status(200).json({
            success: true,
            user: {
                id: user.id,
                full_name: user.full_name,
                wallet_balance: user.wallet_balance,
                current_set: user.current_set,
                current_task: user.current_task
            },
            progress: progress,
            availableTasks: availableTasks,
            stats: {
                total_tasks: stats[0].total_tasks,
                completed_tasks: stats[0].completed_tasks,
                completion_rate: stats[0].total_tasks > 0
                    ? Math.round((stats[0].completed_tasks / stats[0].total_tasks) * 100)
                    : 0,
                total_earned: stats[0].total_earned || 0
            }
        });

    } catch (error) {
        console.error('User progress error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}