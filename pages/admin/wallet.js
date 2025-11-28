import { readData, writeData } from '../../../../utils/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'your-secret-key-change-in-production';

export default function handler(req, res) {
    console.log('💰 Admin Wallet API called:', req.method, req.body);

    if (req.method !== 'PUT') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const users = readData('users.json');

        // Check if user is admin
        const currentUser = users.find(u => u.id === decoded.userId);
        if (!currentUser || currentUser.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { userId, field, value } = req.body;

        console.log('📦 Updating wallet:', { userId, field, value });

        if (!userId || !field || value === undefined) {
            return res.status(400).json({
                message: 'Missing required fields: userId, field, value'
            });
        }

        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex === -1) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Initialize wallet if it doesn't exist with new trialBonus field
        if (!users[userIndex].wallet) {
            users[userIndex].wallet = {
                taskCount: 0,
                bonusPoints: 0,
                pointBalance: 0,
                pendingPoints: 0,
                todayPoints: 0,
                trialBonus: 10000, // New field for trial bonus tracking
                totalDeposit: 0,
                totalWithdraw: 0
            };
        }

        // Validate field
        const validFields = [
            'taskCount', 'bonusPoints', 'pointBalance',
            'pendingPoints', 'todayPoints', 'trialBonus',
            'totalDeposit', 'totalWithdraw'
        ];

        if (!validFields.includes(field)) {
            return res.status(400).json({
                message: 'Invalid field',
                validFields: validFields
            });
        }

        // Convert value to number
        const numericValue = Number(value);
        if (isNaN(numericValue)) {
            return res.status(400).json({ message: 'Value must be a number' });
        }

        // Update the field
        const oldValue = users[userIndex].wallet[field];
        users[userIndex].wallet[field] = numericValue;

        console.log('✅ Wallet updated:', {
            user: users[userIndex].name,
            field: field,
            from: oldValue,
            to: numericValue
        });

        // Save to database
        const saveResult = writeData('users.json', users);
        if (!saveResult) {
            throw new Error('Failed to save user data');
        }

        // Verify the update
        const updatedUsers = readData('users.json');
        const updatedUser = updatedUsers.find(u => u.id === userId);

        console.log('🔍 Verification - new value:', updatedUser.wallet[field]);

        res.status(200).json({
            success: true,
            message: 'Wallet updated successfully',
            user: users[userIndex].name,
            field: field,
            newValue: numericValue,
            oldValue: oldValue
        });

    } catch (error) {
        console.error('❌ Wallet API error:', error);
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
}