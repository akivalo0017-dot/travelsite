import pool from '../../../lib/mysql';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const { userId, taskId } = req.body;

        if (!userId || !taskId) {
            return res.status(400).json({
                success: false,
                message: 'User ID and Task ID are required'
            });
        }

        // Get task details and current progress
        const [tasks] = await connection.execute(
            `SELECT t.*, up.completion_count, up.required_completion 
       FROM tasks t 
       LEFT JOIN user_progress up ON t.id = up.task_id AND up.user_id = ?
       WHERE t.id = ?`,
            [userId, taskId]
        );

        if (tasks.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        const task = tasks[0];
        const currentCount = task.completion_count || 0;
        const requiredCompletion = task.required_completion || 1;

        // Check if already completed
        if (currentCount >= requiredCompletion) {
            return res.status(400).json({
                success: false,
                message: 'Task already completed'
            });
        }

        const newCount = currentCount + 1;
        const isNowCompleted = newCount >= requiredCompletion;

        // Update progress
        if (currentCount === 0) {
            // First time - insert
            await connection.execute(
                `INSERT INTO user_progress 
         (user_id, task_id, set_number, task_number, completion_count, is_completed, completed_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [userId, taskId, task.set_number, task.task_number, newCount, isNowCompleted, isNowCompleted ? new Date() : null]
            );
        } else {
            // Update existing
            await connection.execute(
                `UPDATE user_progress 
         SET completion_count = ?, is_completed = ?, completed_at = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE user_id = ? AND task_id = ?`,
                [newCount, isNowCompleted, isNowCompleted ? new Date() : null, userId, taskId]
            );
        }

        // If completed, update wallet and progression
        if (isNowCompleted) {
            // Add reward to wallet
            await connection.execute(
                'UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?',
                [task.reward_amount, userId]
            );

            // Update user's current task progression
            const [nextTasks] = await connection.execute(
                `SELECT * FROM tasks 
         WHERE set_number = ? AND task_number > ? AND is_active = TRUE 
         ORDER BY task_number LIMIT 1`,
                [task.set_number, task.task_number]
            );

            if (nextTasks.length > 0) {
                // Move to next task in same set
                await connection.execute(
                    'UPDATE users SET current_task = ? WHERE id = ?',
                    [nextTasks[0].task_number, userId]
                );
            } else {
                // Move to next set, first task
                const [nextSetTasks] = await connection.execute(
                    `SELECT * FROM tasks 
           WHERE set_number > ? AND task_number = 1 AND is_active = TRUE 
           ORDER BY set_number LIMIT 1`,
                    [task.set_number]
                );

                if (nextSetTasks.length > 0) {
                    await connection.execute(
                        'UPDATE users SET current_set = ?, current_task = 1 WHERE id = ?',
                        [nextSetTasks[0].set_number, userId]
                    );
                }
            }
        }

        await connection.commit();

        res.status(200).json({
            success: true,
            message: isNowCompleted ? 'Task completed!' : 'Progress updated',
            completed: isNowCompleted,
            reward: isNowCompleted ? task.reward_amount : 0,
            progress: {
                current: newCount,
                required: requiredCompletion,
                percentage: Math.round((newCount / requiredCompletion) * 100)
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error('Task completion error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    } finally {
        connection.release();
    }
}