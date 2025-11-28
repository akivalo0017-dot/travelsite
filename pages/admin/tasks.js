import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

export default function TaskManagement() {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [userProgress, setUserProgress] = useState(null);
    const [premiumTask, setPremiumTask] = useState({
        set: 1,
        task: 1,
        penalty: 5000,
        pendingAmount: 0
    });
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            const userData = localStorage.getItem('user');
            const token = localStorage.getItem('token');

            if (!token || !userData) {
                router.push('/auth/login');
                return;
            }

            const user = JSON.parse(userData);
            if (user.role !== 'admin') {
                router.push('/user/dashboard');
                return;
            }

            await loadUsers();
            loadPremiumConfig();
            setLoading(false);
        };

        checkAuth();
    }, [router]);

    const loadUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/admin/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            }
        } catch (error) {
            console.error('Error loading users:', error);
        }
    };

    const loadPremiumConfig = () => {
        const savedPremium = JSON.parse(localStorage.getItem('premiumTask') || '{"set":1,"task":1,"penalty":5000,"pendingAmount":0}');
        setPremiumTask(savedPremium);
    };

    const savePremiumConfig = () => {
        localStorage.setItem('premiumTask', JSON.stringify(premiumTask));
        alert('Premium task configuration saved!');
    };

    const resetUserSet = async (userId, targetSet) => {
        if (!confirm(`Reset user to Set ${targetSet}? This will reset their task progress.`)) return;

        try {
            const token = localStorage.getItem('token');

            // Reset task count to appropriate value based on target set
            const baseTaskCount = (targetSet - 1) * 30;

            const response = await fetch('/api/admin/wallet', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId,
                    field: 'taskCount',
                    value: baseTaskCount
                })
            });

            if (response.ok) {
                // Also reset user progress in localStorage
                const progress = {
                    currentSet: targetSet,
                    currentTask: 1,
                    taskCompleted: baseTaskCount
                };

                localStorage.setItem(`userProgress_${userId}`, JSON.stringify(progress));
                await loadUsers();
                alert(`User reset to Set ${targetSet}`);
            } else {
                alert('Failed to reset user set');
            }
        } catch (error) {
            console.error('Error resetting user set:', error);
            alert('Error resetting user set');
        }
    };

    const resetUserBalance = async (userId) => {
        if (!confirm('Reset user balance to 0? This will clear their earnings.')) return;

        try {
            const token = localStorage.getItem('token');

            const response = await fetch('/api/admin/wallet', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId,
                    field: 'pointBalance',
                    value: 0
                })
            });

            if (response.ok) {
                await loadUsers();
                alert('User balance reset to 0');
            } else {
                alert('Failed to reset balance');
            }
        } catch (error) {
            console.error('Error resetting balance:', error);
            alert('Error resetting balance');
        }
    };

    const applyPremiumTask = async (userId) => {
        if (!confirm(`Apply premium task to this user? Penalty: ₹${premiumTask.penalty}`)) return;

        try {
            const token = localStorage.getItem('token');
            const user = users.find(u => u.id === userId);

            if (!user) return;

            // Calculate new values
            const currentBalance = user.wallet.pointBalance || 0;
            const newBalance = currentBalance - premiumTask.penalty;
            const newPending = (user.wallet.pendingPoints || 0) + currentBalance + premiumTask.pendingAmount;

            // Update wallet
            const balanceResponse = await fetch('/api/admin/wallet', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId,
                    field: 'pointBalance',
                    value: newBalance
                })
            });

            const pendingResponse = await fetch('/api/admin/wallet', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId,
                    field: 'pendingPoints',
                    value: newPending
                })
            });

            if (balanceResponse.ok && pendingResponse.ok) {
                // Save premium task assignment
                const premiumAssignment = {
                    userId,
                    premiumTask,
                    appliedAt: new Date().toISOString(),
                    originalBalance: currentBalance
                };

                const assignments = JSON.parse(localStorage.getItem('premiumAssignments') || '[]');
                assignments.push(premiumAssignment);
                localStorage.setItem('premiumAssignments', JSON.stringify(assignments));

                await loadUsers();
                alert('Premium task applied successfully!');
            } else {
                alert('Failed to apply premium task');
            }
        } catch (error) {
            console.error('Error applying premium task:', error);
            alert('Error applying premium task');
        }
    };

    const resetPremiumPenalty = async (userId) => {
        if (!confirm('Reset premium penalty to 0? This will move pending amount back to balance.')) return;

        try {
            const token = localStorage.getItem('token');
            const user = users.find(u => u.id === userId);

            if (!user) return;

            const pendingAmount = user.wallet.pendingPoints || 0;

            // Reset both balance and pending
            const balanceResponse = await fetch('/api/admin/wallet', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId,
                    field: 'pointBalance',
                    value: pendingAmount
                })
            });

            const pendingResponse = await fetch('/api/admin/wallet', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId,
                    field: 'pendingPoints',
                    value: 0
                })
            });

            if (balanceResponse.ok && pendingResponse.ok) {
                await loadUsers();
                alert('Premium penalty reset successfully!');
            } else {
                alert('Failed to reset premium penalty');
            }
        } catch (error) {
            console.error('Error resetting premium penalty:', error);
            alert('Error resetting premium penalty');
        }
    };

    if (loading) {
        return (
            <Layout>
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <p>Loading Task Management...</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="task-management">
                <h1>Task Management</h1>

                {/* Premium Task Configuration */}
                <div className="section">
                    <h2>Premium Task Configuration</h2>
                    <div className="premium-config">
                        <div className="config-item">
                            <label>Set Number:</label>
                            <select
                                value={premiumTask.set}
                                onChange={(e) => setPremiumTask({ ...premiumTask, set: parseInt(e.target.value) })}
                            >
                                <option value={1}>Set 1</option>
                                <option value={2}>Set 2</option>
                                <option value={3}>Set 3</option>
                            </select>
                        </div>
                        <div className="config-item">
                            <label>Task Number:</label>
                            <input
                                type="number"
                                min="1"
                                max="30"
                                value={premiumTask.task}
                                onChange={(e) => setPremiumTask({ ...premiumTask, task: parseInt(e.target.value) })}
                            />
                        </div>
                        <div className="config-item">
                            <label>Penalty Amount (₹):</label>
                            <input
                                type="number"
                                value={premiumTask.penalty}
                                onChange={(e) => setPremiumTask({ ...premiumTask, penalty: parseInt(e.target.value) })}
                            />
                        </div>
                        <div className="config-item">
                            <label>Additional Pending Amount (₹):</label>
                            <input
                                type="number"
                                value={premiumTask.pendingAmount}
                                onChange={(e) => setPremiumTask({ ...premiumTask, pendingAmount: parseInt(e.target.value) })}
                            />
                        </div>
                        <button onClick={savePremiumConfig} className="btn-primary">
                            Save Premium Task Configuration
                        </button>
                    </div>
                    <div className="premium-info">
                        <p><strong>Current Premium Task:</strong> Set {premiumTask.set}, Task {premiumTask.task}</p>
                        <p><strong>Penalty:</strong> ₹{premiumTask.penalty}</p>
                        <p><strong>Additional Pending:</strong> ₹{premiumTask.pendingAmount}</p>
                    </div>
                </div>

                {/* User Management */}
                <div className="section">
                    <h2>User Task Management</h2>
                    <div className="table-container">
                        <table className="users-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Task Count</th>
                                    <th>Current Set</th>
                                    <th>Balance</th>
                                    <th>Pending</th>
                                    <th>Premium Actions</th>
                                    <th>Reset Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id}>
                                        <td>
                                            <strong>{user.name}</strong>
                                            <br />
                                            <small>{user.phone}</small>
                                        </td>
                                        <td>{user.wallet?.taskCount || 0}/90</td>
                                        <td>Set {Math.ceil((user.wallet?.taskCount || 0) / 30) || 1}</td>
                                        <td>₹{user.wallet?.pointBalance || 0}</td>
                                        <td>₹{user.wallet?.pendingPoints || 0}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    onClick={() => applyPremiumTask(user.id)}
                                                    className="btn-warning"
                                                >
                                                    Apply Premium Task
                                                </button>
                                                <button
                                                    onClick={() => resetPremiumPenalty(user.id)}
                                                    className="btn-success"
                                                >
                                                    Reset Penalty
                                                </button>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    onClick={() => resetUserSet(user.id, 1)}
                                                    className="btn-info"
                                                >
                                                    Reset to Set 1
                                                </button>
                                                <button
                                                    onClick={() => resetUserSet(user.id, 2)}
                                                    className="btn-info"
                                                >
                                                    Reset to Set 2
                                                </button>
                                                <button
                                                    onClick={() => resetUserSet(user.id, 3)}
                                                    className="btn-info"
                                                >
                                                    Reset to Set 3
                                                </button>
                                                <button
                                                    onClick={() => resetUserBalance(user.id)}
                                                    className="btn-danger"
                                                >
                                                    Reset Balance
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .task-management {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        h1 {
          color: #2c3e50;
          margin-bottom: 30px;
        }

        .section {
          background: white;
          border-radius: 10px;
          padding: 25px;
          margin-bottom: 25px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        h2 {
          color: #34495e;
          margin-bottom: 20px;
        }

        .premium-config {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .config-item {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .config-item label {
          font-weight: bold;
          color: #2c3e50;
          font-size: 14px;
        }

        .config-item input, .config-item select {
          padding: 10px;
          border: 2px solid #bdc3c7;
          border-radius: 6px;
          font-size: 14px;
        }

        .btn-primary, .btn-warning, .btn-danger, .btn-success, .btn-info {
          padding: 10px 15px;
          border: none;
          border-radius: 6px;
          color: white;
          cursor: pointer;
          font-weight: bold;
          transition: all 0.3s;
          font-size: 12px;
          margin: 2px;
        }

        .btn-primary { background: #3498db; }
        .btn-warning { background: #f39c12; }
        .btn-danger { background: #e74c3c; }
        .btn-success { background: #27ae60; }
        .btn-info { background: #17a2b8; }

        .btn-primary:hover { background: #2980b9; }
        .btn-warning:hover { background: #e67e22; }
        .btn-danger:hover { background: #c0392b; }
        .btn-success:hover { background: #219a52; }
        .btn-info:hover { background: #138496; }

        .premium-info {
          background: #e3f2fd;
          padding: 15px;
          border-radius: 6px;
          margin-top: 15px;
        }

        .premium-info p {
          margin: 5px 0;
          color: #1976d2;
        }

        .table-container {
          overflow-x: auto;
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .users-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 800px;
        }

        .users-table th,
        .users-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e1e5e9;
        }

        .users-table th {
          background: #34495e;
          color: white;
          font-weight: 600;
          font-size: 14px;
        }

        .users-table tr:nth-child(even) {
          background: #f8f9fa;
        }

        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        @media (max-width: 768px) {
          .task-management {
            padding: 10px;
          }

          .section {
            padding: 15px;
          }

          .premium-config {
            grid-template-columns: 1fr;
          }

          .action-buttons {
            flex-direction: row;
            flex-wrap: wrap;
          }

          .btn-primary, .btn-warning, .btn-danger, .btn-success, .btn-info {
            font-size: 11px;
            padding: 8px 10px;
          }
        }
      `}</style>
        </Layout>
    );
}