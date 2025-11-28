import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

export default function WithdrawalManagement() {
    const [withdrawalRequests, setWithdrawalRequests] = useState([]);
    const [users, setUsers] = useState([]);
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

            await loadWithdrawalRequests();
            await loadUsers();
            setLoading(false);
        };

        checkAuth();
    }, [router]);

    const loadWithdrawalRequests = () => {
        const requests = JSON.parse(localStorage.getItem('withdrawalRequests') || '[]');
        setWithdrawalRequests(requests);
    };

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

    const updateWithdrawalStatus = async (requestId, status) => {
        const requests = JSON.parse(localStorage.getItem('withdrawalRequests') || '[]');
        const requestIndex = requests.findIndex(req => req.id === requestId);

        if (requestIndex === -1) return;

        if (status === 'approved') {
            // Update transaction history
            const transactionHistory = JSON.parse(localStorage.getItem('transactionHistory') || '[]');
            const transactionIndex = transactionHistory.findIndex(t => t.id === requestId);

            if (transactionIndex !== -1) {
                transactionHistory[transactionIndex].status = 'completed';
                localStorage.setItem('transactionHistory', JSON.stringify(transactionHistory));
            }
        } else if (status === 'cancelled') {
            // Return amount to user's balance
            const request = requests[requestIndex];
            const user = users.find(u => u.id === request.userId);

            if (user) {
                try {
                    const token = localStorage.getItem('token');
                    await fetch('/api/admin/wallet', {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            userId: request.userId,
                            field: 'pointBalance',
                            value: (user.wallet.pointBalance || 0) + request.amount
                        })
                    });
                } catch (error) {
                    console.error('Error returning funds:', error);
                }
            }

            // Update transaction history
            const transactionHistory = JSON.parse(localStorage.getItem('transactionHistory') || '[]');
            const transactionIndex = transactionHistory.findIndex(t => t.id === requestId);

            if (transactionIndex !== -1) {
                transactionHistory[transactionIndex].status = 'cancelled';
                localStorage.setItem('transactionHistory', JSON.stringify(transactionHistory));
            }
        }

        // Update request status
        requests[requestIndex].status = status;
        requests[requestIndex].processedAt = new Date().toISOString();
        localStorage.setItem('withdrawalRequests', JSON.stringify(requests));

        setWithdrawalRequests([...requests]);
        alert(`Withdrawal request ${status} successfully!`);
    };

    if (loading) {
        return (
            <Layout>
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <p>Loading Withdrawal Management...</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="withdrawal-management">
                <h1>Withdrawal Management</h1>

                <div className="stats-overview">
                    <div className="stat-card">
                        <div className="stat-number">{withdrawalRequests.length}</div>
                        <div className="stat-label">Total Requests</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-number">
                            {withdrawalRequests.filter(req => req.status === 'pending').length}
                        </div>
                        <div className="stat-label">Pending</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-number">
                            {withdrawalRequests.filter(req => req.status === 'approved').length}
                        </div>
                        <div className="stat-label">Approved</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-number">
                            {withdrawalRequests.filter(req => req.status === 'cancelled').length}
                        </div>
                        <div className="stat-label">Cancelled</div>
                    </div>
                </div>

                <div className="requests-section">
                    <h2>Pending Withdrawal Requests</h2>

                    {withdrawalRequests.filter(req => req.status === 'pending').length === 0 ? (
                        <div className="no-requests">
                            <p>No pending withdrawal requests</p>
                        </div>
                    ) : (
                        <div className="requests-list">
                            {withdrawalRequests
                                .filter(req => req.status === 'pending')
                                .map(request => (
                                    <div key={request.id} className="request-card">
                                        <div className="request-info">
                                            <div className="user-info">
                                                <strong>{request.userName}</strong>
                                                <span>User ID: {request.userId}</span>
                                            </div>
                                            <div className="amount-info">
                                                <div className="amount">₹{request.amount.toLocaleString()}</div>
                                                <div className="date">{new Date(request.date).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        <div className="request-actions">
                                            <button
                                                className="approve-btn"
                                                onClick={() => updateWithdrawalStatus(request.id, 'approved')}
                                            >
                                                Approve
                                            </button>
                                            <button
                                                className="cancel-btn"
                                                onClick={() => updateWithdrawalStatus(request.id, 'cancelled')}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    )}
                </div>

                <div className="history-section">
                    <h2>Request History</h2>
                    <div className="history-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Amount</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Processed</th>
                                </tr>
                            </thead>
                            <tbody>
                                {withdrawalRequests
                                    .filter(req => req.status !== 'pending')
                                    .map(request => (
                                        <tr key={request.id}>
                                            <td>
                                                <strong>{request.userName}</strong>
                                                <br />
                                                <small>ID: {request.userId}</small>
                                            </td>
                                            <td>₹{request.amount.toLocaleString()}</td>
                                            <td>{new Date(request.date).toLocaleDateString()}</td>
                                            <td>
                                                <span className={`status-badge ${request.status}`}>
                                                    {request.status}
                                                </span>
                                            </td>
                                            <td>
                                                {request.processedAt ? new Date(request.processedAt).toLocaleDateString() : '-'}
                                            </td>
                                        </tr>
                                    ))
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .withdrawal-management {
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
        }

        h1 {
          color: #2c3e50;
          margin-bottom: 30px;
        }

        .stats-overview {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: white;
          padding: 25px;
          border-radius: 10px;
          text-align: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .stat-number {
          font-size: 2rem;
          font-weight: bold;
          color: #2c3e50;
          margin-bottom: 5px;
        }

        .stat-label {
          color: #7f8c8d;
          font-size: 14px;
        }

        .requests-section, .history-section {
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

        .no-requests {
          text-align: center;
          padding: 40px;
          color: #6c757d;
          font-style: italic;
        }

        .requests-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .request-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border: 1px solid #e1e5e9;
          border-radius: 8px;
          background: #f8f9fa;
        }

        .request-info {
          display: flex;
          gap: 30px;
          align-items: center;
        }

        .user-info {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .user-info strong {
          color: #2c3e50;
          font-size: 16px;
        }

        .user-info span {
          color: #7f8c8d;
          font-size: 12px;
        }

        .amount-info {
          text-align: center;
        }

        .amount {
          font-size: 1.5rem;
          font-weight: bold;
          color: #27ae60;
        }

        .date {
          color: #7f8c8d;
          font-size: 12px;
        }

        .request-actions {
          display: flex;
          gap: 10px;
        }

        .approve-btn, .cancel-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 5px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s;
        }

        .approve-btn {
          background: #27ae60;
          color: white;
        }

        .approve-btn:hover {
          background: #219a52;
        }

        .cancel-btn {
          background: #e74c3c;
          color: white;
        }

        .cancel-btn:hover {
          background: #c0392b;
        }

        .history-table {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e1e5e9;
        }

        th {
          background: #34495e;
          color: white;
          font-weight: 600;
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: bold;
          text-transform: uppercase;
        }

        .status-badge.approved {
          background: #d4edda;
          color: #155724;
        }

        .status-badge.cancelled {
          background: #f8d7da;
          color: #721c24;
        }

        @media (max-width: 768px) {
          .withdrawal-management {
            padding: 10px;
          }

          .requests-section, .history-section {
            padding: 15px;
          }

          .request-card {
            flex-direction: column;
            gap: 15px;
            text-align: center;
          }

          .request-info {
            flex-direction: column;
            gap: 15px;
          }

          .request-actions {
            width: 100%;
            justify-content: center;
          }

          .stats-overview {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
        </Layout>
    );
}