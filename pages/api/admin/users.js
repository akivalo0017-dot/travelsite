import pool from '../../../lib/mysql';

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Verify admin access (you can enhance this with proper authentication)
    const checkAdminAccess = (req) => {
        // TODO: Implement proper JWT or session-based admin authentication
        // For now, this is a placeholder - you should implement proper auth middleware
        return true;
    };

    if (!checkAdminAccess(req)) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin privileges required.'
        });
    }

    try {
        // GET - Fetch all users with pagination and filters
        if (req.method === 'GET') {
            const {
                page = 1,
                limit = 10,
                search = '',
                role = '',
                approved = '',
                sortBy = 'created_at',
                sortOrder = 'DESC'
            } = req.query;

            const offset = (page - 1) * limit;

            // Build WHERE conditions
            let whereConditions = [];
            let queryParams = [];

            if (search) {
                whereConditions.push('(u.email LIKE ? OR u.full_name LIKE ?)');
                queryParams.push(`%${search}%`, `%${search}%`);
            }

            if (role) {
                whereConditions.push('u.role = ?');
                queryParams.push(role);
            }

            if (approved !== '') {
                whereConditions.push('u.is_approved = ?');
                queryParams.push(approved === 'true');
            }

            const whereClause = whereConditions.length > 0
                ? `WHERE ${whereConditions.join(' AND ')}`
                : '';

            // Main users query with progress stats
            const usersQuery = `
        SELECT 
          u.id,
          u.email,
          u.full_name,
          u.role,
          u.is_approved,
          u.wallet_balance,
          u.current_set,
          u.current_task,
          u.created_at,
          u.updated_at,
          COUNT(DISTINCT up.task_id) as total_tasks_assigned,
          COUNT(DISTINCT CASE WHEN up.is_completed = TRUE THEN up.task_id END) as completed_tasks,
          COALESCE(SUM(CASE WHEN up.is_completed = TRUE THEN t.reward_amount ELSE 0 END), 0) as total_earnings
        FROM users u
        LEFT JOIN user_progress up ON u.id = up.user_id
        LEFT JOIN tasks t ON up.task_id = t.id
        ${whereClause}
        GROUP BY u.id
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT ? OFFSET ?
      `;

            queryParams.push(parseInt(limit), offset);

            // Count query for pagination
            const countQuery = `
        SELECT COUNT(*) as total
        FROM users u
        ${whereClause}
      `;

            const [users] = await pool.execute(usersQuery, queryParams);

            // Remove count params for total calculation
            const countParams = queryParams.slice(0, -2);
            const [countResult] = await pool.execute(countQuery, countParams);
            const totalUsers = countResult[0].total;

            // Format response
            const formattedUsers = users.map(user => ({
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                is_approved: Boolean(user.is_approved),
                wallet_balance: parseFloat(user.wallet_balance),
                current_set: user.current_set,
                current_task: user.current_task,
                total_tasks_assigned: user.total_tasks_assigned,
                completed_tasks: user.completed_tasks,
                completion_rate: user.total_tasks_assigned > 0
                    ? Math.round((user.completed_tasks / user.total_tasks_assigned) * 100)
                    : 0,
                total_earnings: parseFloat(user.total_earnings),
                created_at: user.created_at,
                updated_at: user.updated_at
            }));

            res.status(200).json({
                success: true,
                users: formattedUsers,
                pagination: {
                    current_page: parseInt(page),
                    total_pages: Math.ceil(totalUsers / limit),
                    total_users: totalUsers,
                    has_next: page < Math.ceil(totalUsers / limit),
                    has_prev: page > 1
                }
            });

            // POST - Create new user (admin functionality)
        } else if (req.method === 'POST') {
            const { email, password, full_name, role = 'user', is_approved = false } = req.body;

            if (!email || !password || !full_name) {
                return res.status(400).json({
                    success: false,
                    message: 'Email, password, and full name are required'
                });
            }

            // Check if user already exists
            const [existingUsers] = await pool.execute(
                'SELECT id FROM users WHERE email = ?',
                [email]
            );

            if (existingUsers.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'User with this email already exists'
                });
            }

            // Hash password (you'll need to import bcrypt)
            const bcrypt = await import('bcrypt');
            const hashedPassword = await bcrypt.hash(password, 12);

            // Insert new user
            const [result] = await pool.execute(
                `INSERT INTO users (email, password, full_name, role, is_approved, wallet_balance) 
         VALUES (?, ?, ?, ?, ?, 0.00)`,
                [email, hashedPassword, full_name, role, is_approved]
            );

            res.status(201).json({
                success: true,
                message: 'User created successfully',
                user: {
                    id: result.insertId,
                    email,
                    full_name,
                    role,
                    is_approved: Boolean(is_approved)
                }
            });

            // PUT - Update user
        } else if (req.method === 'PUT') {
            const { userId, updates } = req.body;

            if (!userId || !updates) {
                return res.status(400).json({
                    success: false,
                    message: 'User ID and updates are required'
                });
            }

            // Build dynamic update query
            const allowedFields = ['email', 'full_name', 'role', 'is_approved', 'wallet_balance', 'current_set', 'current_task'];
            const updateFields = [];
            const updateValues = [];

            Object.keys(updates).forEach(field => {
                if (allowedFields.includes(field)) {
                    updateFields.push(`${field} = ?`);
                    updateValues.push(updates[field]);
                }
            });

            if (updateFields.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No valid fields to update'
                });
            }

            updateValues.push(userId);

            const updateQuery = `
        UPDATE users 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

            await pool.execute(updateQuery, updateValues);

            res.status(200).json({
                success: true,
                message: 'User updated successfully'
            });

            // DELETE - Delete user
        } else if (req.method === 'DELETE') {
            const { userId } = req.body;

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: 'User ID is required'
                });
            }

            // Start transaction to delete related records
            const connection = await pool.getConnection();
            await connection.beginTransaction();

            try {
                // Delete user progress
                await connection.execute('DELETE FROM user_progress WHERE user_id = ?', [userId]);

                // Delete admin assignments
                await connection.execute('DELETE FROM admin_assignments WHERE user_id = ? OR admin_id = ?', [userId, userId]);

                // Delete user
                await connection.execute('DELETE FROM users WHERE id = ?', [userId]);

                await connection.commit();

                res.status(200).json({
                    success: true,
                    message: 'User deleted successfully'
                });

            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }

        } else {
            res.status(405).json({
                success: false,
                message: 'Method not allowed'
            });
        }

    } catch (error) {
        console.error('Admin users API error:', error);

        // Handle specific MySQL errors
        let errorMessage = 'Internal server error';
        if (error.code === 'ER_DUP_ENTRY') {
            errorMessage = 'Email already exists';
        } else if (error.code === 'ER_NO_REFERENCED_ROW') {
            errorMessage = 'Referenced user not found';
        }

        res.status(500).json({
            success: false,
            message: errorMessage,
            ...(process.env.NODE_ENV === 'development' && { debug: error.message })
        });
    }
}