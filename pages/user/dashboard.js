import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

export default function UserDashboard() {
    const [user, setUser] = useState(null);
    const [wallet, setWallet] = useState({
        taskCount: 0,
        pointBalance: 0,
        pendingPoints: 0,
        todayPoints: 0,
        trialBonus: 10000
    });
    const [currentSet, setCurrentSet] = useState(1);
    const [currentTask, setCurrentTask] = useState(1);
    const [totalTasksCompleted, setTotalTasksCompleted] = useState(0);
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Only run on client side
        if (typeof window !== 'undefined') {
            const userData = localStorage.getItem('user');
            if (!userData) {
                router.push('/auth/login');
                return;
            }

            const userObj = JSON.parse(userData);
            setUser(userObj);

            loadWalletData();
            loadProgressData();
            loadRecentActivity();
            setLoading(false);
        }
    }, []);

    const loadWalletData = () => {
        if (typeof window !== 'undefined') {
            const savedWallet = JSON.parse(localStorage.getItem('userWallet') || '{}');
            setWallet({
                taskCount: savedWallet.taskCount || 0,
                pointBalance: savedWallet.pointBalance || 0,
                pendingPoints: savedWallet.pendingPoints || 0,
                todayPoints: savedWallet.todayPoints || 0,
                trialBonus: savedWallet.trialBonus !== undefined ? savedWallet.trialBonus : 10000
            });
        }
    };

    const loadProgressData = () => {
        if (typeof window !== 'undefined') {
            const savedProgress = JSON.parse(localStorage.getItem('bookingProgress') || '{}');
            setCurrentSet(savedProgress.currentSet || 1);
            setCurrentTask(savedProgress.currentTask || 1);
            setTotalTasksCompleted(savedProgress.totalTasksCompleted || 0);
        }
    };

    const loadRecentActivity = () => {
        if (typeof window !== 'undefined') {
            const transactionHistory = JSON.parse(localStorage.getItem('transactionHistory') || '[]');
            setRecentActivity(transactionHistory.slice(0, 5)); // Show only 5 most recent activities
        }
    };

    const getCurrentSetProgress = () => {
        const tasksInCurrentSet = (wallet.taskCount % 30) || (wallet.taskCount === 0 ? 0 : 30);
        return {
            completed: tasksInCurrentSet,
            total: 30,
            percentage: (tasksInCurrentSet / 30) * 100
        };
    };

    const getLevelProgress = () => {
        const totalTasks = totalTasksCompleted || wallet.taskCount || 0;
        const levels = [
            { level: 1, tasks: 150, name: "Level 1", bonus: 2000 },
            { level: 2, tasks: 300, name: "Level 2", bonus: 3000 },
            { level: 3, tasks: 450, name: "Level 3", bonus: 6000 },
            { level: 4, tasks: 600, name: "Agent Level", bonus: 0 }
        ];

        const currentLevel = levels.find(level => totalTasks < level.tasks) || levels[0];
        const nextLevel = levels[levels.findIndex(level => level.tasks === currentLevel.tasks) + 1];

        if (!nextLevel) {
            return { current: currentLevel, next: null, progress: 100, remaining: 0 };
        }

        const progress = ((totalTasks - currentLevel.tasks) / (nextLevel.tasks - currentLevel.tasks)) * 100;
        const remainingTasks = nextLevel.tasks - totalTasks;

        return {
            current: currentLevel,
            next: nextLevel,
            progress: Math.max(0, Math.min(100, progress)),
            remaining: remainingTasks
        };
    };

    const levelProgress = getLevelProgress();
    const setProgress = getCurrentSetProgress();

    const handleNavigation = (path) => {
        router.push(path);
    };

    if (loading) {
        return (
            <Layout>
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <p>Loading your dashboard...</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="user-dashboard">
                <div className="welcome-section">
                    <h1>Welcome back, {user?.name}! 👋</h1>
                    <p>Manage your bookings, wallet, and account settings</p>
                </div>

                <div className="dashboard-grid">
                    {/* Quick Stats */}
                    <div className="stats-section">
                        <h2>Quick Overview</h2>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon">📊</div>
                                <div className="stat-info">
                                    <div className="stat-value">{setProgress.completed}/30</div>
                                    <div className="stat-label">Tasks Completed (Set {currentSet})</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">💰</div>
                                <div className="stat-info">
                                    <div className="stat-value">₹{wallet.pointBalance.toFixed(2)}</div>
                                    <div className="stat-label">Available Balance</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">🎯</div>
                                <div className="stat-info">
                                    <div className="stat-value">₹{wallet.todayPoints.toFixed(2)}</div>
                                    <div className="stat-label">Today's Earnings</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">⏳</div>
                                <div className="stat-info">
                                    <div className="stat-value">₹{wallet.pendingPoints.toFixed(2)}</div>
                                    <div className="stat-label">Pending Amount</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="actions-section">
                        <h2>Quick Actions</h2>
                        <div className="actions-grid">
                            <div
                                className="action-card primary"
                                onClick={() => handleNavigation('/user/booking')}
                            >
                                <div className="action-icon">📅</div>
                                <div className="action-content">
                                    <h3>Start Booking</h3>
                                    <p>Complete tasks and earn rewards</p>
                                </div>
                                <div className="action-arrow">→</div>
                            </div>

                            <div
                                className="action-card success"
                                onClick={() => handleNavigation('/user/wallet')}
                            >
                                <div className="action-icon">💰</div>
                                <div className="action-content">
                                    <h3>My Wallet</h3>
                                    <p>View balance and transactions</p>
                                </div>
                                <div className="action-arrow">→</div>
                            </div>

                            <div
                                className="action-card info"
                                onClick={() => handleNavigation('/user/booking-history')}
                            >
                                <div className="action-icon">📋</div>
                                <div className="action-content">
                                    <h3>Booking History</h3>
                                    <p>View your completed tasks</p>
                                </div>
                                <div className="action-arrow">→</div>
                            </div>

                            <div className="action-card warning">
                                <div className="action-icon">ℹ️</div>
                                <div className="action-content">
                                    <h3>Account Info</h3>
                                    <p>View your account details</p>
                                </div>
                                <div className="action-arrow">→</div>
                            </div>
                        </div>
                    </div>

                    {/* Level Progress */}
                    <div className="progress-section">
                        <h2>Your Progress - {levelProgress.current.name}</h2>
                        <div className="progress-card">
                            <div className="progress-header">
                                <h3>Next Level: {levelProgress.next ? levelProgress.next.name : 'Max Level'}</h3>
                                {levelProgress.next && (
                                    <span className="progress-percent">
                                        {Math.round(levelProgress.progress)}%
                                    </span>
                                )}
                            </div>
                            {levelProgress.next ? (
                                <>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{ width: `${levelProgress.progress}%` }}
                                        ></div>
                                    </div>
                                    <div className="progress-text">
                                        {totalTasksCompleted} of {levelProgress.next.tasks} tasks completed
                                        {levelProgress.next.bonus > 0 && (
                                            <span className="bonus-text"> • ₹{levelProgress.next.bonus} bonus</span>
                                        )}
                                    </div>
                                    <div className="remaining-tasks">
                                        {levelProgress.remaining} tasks remaining for next level
                                    </div>
                                </>
                            ) : (
                                <div className="max-level">
                                    🎉 You've reached the maximum level! Contact support for agent benefits.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Set Progress */}
                    <div className="set-progress-section">
                        <h2>Current Set Progress</h2>
                        <div className="set-progress-card">
                            <div className="set-info">
                                <h3>Set {currentSet} of 3</h3>
                                <span className="task-count">{setProgress.completed}/30 tasks</span>
                            </div>
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${setProgress.percentage}%` }}
                                ></div>
                            </div>
                            <div className="set-actions">
                                {setProgress.completed >= 30 && currentSet < 3 && (
                                    <div className="set-complete">
                                        <span>✅ Set completed! Contact support to proceed to next set.</span>
                                    </div>
                                )}
                                {setProgress.completed >= 30 && currentSet === 3 && (
                                    <div className="all-sets-complete">
                                        <span>🎉 All sets completed! You can now withdraw your earnings.</span>
                                        <button
                                            onClick={() => handleNavigation('/user/wallet')}
                                            className="withdraw-btn"
                                        >
                                            Go to Wallet
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="activity-section">
                        <h2>Recent Activity</h2>
                        <div className="activity-list">
                            {recentActivity.length > 0 ? (
                                recentActivity.map(activity => (
                                    <div key={activity.id} className="activity-item">
                                        <div className="activity-icon">
                                            {activity.type === 'deposit' && '💰'}
                                            {activity.type === 'withdraw' && '💳'}
                                            {activity.type === 'task' && '📊'}
                                            {activity.type === 'bonus' && '🎁'}
                                        </div>
                                        <div className="activity-content">
                                            <p><strong>
                                                {activity.type === 'deposit' && 'Deposit'}
                                                {activity.type === 'withdraw' && 'Withdrawal'}
                                                {activity.type === 'task' && 'Task Commission'}
                                                {activity.type === 'bonus' && 'Bonus'}
                                            </strong></p>
                                            <p className="activity-description">
                                                {activity.description || 'Transaction'}
                                            </p>
                                            <p className="activity-time">{activity.date}</p>
                                        </div>
                                        <div className={`activity-amount ${activity.type}`}>
                                            {activity.type === 'withdraw' ? '-' : '+'}₹ {activity.amount?.toLocaleString() || '0'}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="no-activity">
                                    <p>No recent activity</p>
                                    <p className="subtext">Your activity will appear here</p>
                                </div>
                            )}
                        </div>
                        {recentActivity.length > 0 && (
                            <button
                                className="view-all-btn"
                                onClick={() => handleNavigation('/user/wallet')}
                            >
                                View All Activity
                            </button>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <footer className="dashboard-footer">
                    <div className="footer-content">
                        <div className="footer-section">
                            <h4>One Travel Working</h4>
                            <p>Your trusted partner for travel bookings and earnings</p>
                        </div>
                        <div className="footer-section">
                            <h4>Quick Links</h4>
                            <ul>
                                <li><a href="/user/booking">Start Booking</a></li>
                                <li><a href="/user/wallet">My Wallet</a></li>
                                <li><a href="/user/booking-history">Booking History</a></li>
                            </ul>
                        </div>
                        <div className="footer-section">
                            <h4>Support</h4>
                            <ul>
                                <li>Email: support@onetravel.com</li>
                                <li>Phone: +91-XXXXX-XXXXX</li>
                                <li>Available 24/7</li>
                            </ul>
                        </div>
                        <div className="footer-section">
                            <h4>Legal</h4>
                            <ul>
                                <li><a href="#">Terms of Service</a></li>
                                <li><a href="#">Privacy Policy</a></li>
                                <li><a href="#">Refund Policy</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p>&copy; 2024 One Travel Working. All rights reserved.</p>
                    </div>
                </footer>
            </div>

            <style jsx>{`
        .user-dashboard {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .welcome-section {
          text-align: center;
          margin-bottom: 40px;
          padding: 30px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 15px;
          color: white;
        }

        .welcome-section h1 {
          margin: 0 0 10px 0;
          font-size: 2.5rem;
        }

        .welcome-section p {
          margin: 0;
          opacity: 0.9;
          font-size: 1.1rem;
        }

        .dashboard-grid {
          display: grid;
          gap: 30px;
          margin-bottom: 40px;
        }

        .stats-section h2,
        .actions-section h2,
        .progress-section h2,
        .set-progress-section h2,
        .activity-section h2 {
          color: #2c3e50;
          margin-bottom: 20px;
          font-size: 1.5rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .stat-card {
          background: white;
          padding: 25px;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 15px;
          transition: transform 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-2px);
        }

        .stat-icon {
          font-size: 2rem;
        }

        .stat-value {
          font-size: 1.8rem;
          font-weight: bold;
          color: #2c3e50;
          margin-bottom: 5px;
        }

        .stat-label {
          color: #7f8c8d;
          font-size: 0.9rem;
        }

        .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        .action-card {
          background: white;
          padding: 25px;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 15px;
          cursor: pointer;
          transition: all 0.3s;
          border-left: 4px solid;
        }

        .action-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
        }

        .action-card.primary {
          border-left-color: #3498db;
        }

        .action-card.success {
          border-left-color: #27ae60;
        }

        .action-card.info {
          border-left-color: #17a2b8;
        }

        .action-card.warning {
          border-left-color: #f39c12;
        }

        .action-icon {
          font-size: 2rem;
        }

        .action-content {
          flex: 1;
        }

        .action-content h3 {
          margin: 0 0 5px 0;
          color: #2c3e50;
          font-size: 1.2rem;
        }

        .action-content p {
          margin: 0;
          color: #7f8c8d;
          font-size: 0.9rem;
        }

        .action-arrow {
          font-size: 1.5rem;
          color: #bdc3c7;
          transition: color 0.3s;
        }

        .action-card:hover .action-arrow {
          color: #3498db;
        }

        .progress-card, .set-progress-card {
          background: white;
          padding: 25px;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .progress-header h3 {
          margin: 0;
          color: #2c3e50;
        }

        .progress-percent {
          font-size: 1.2rem;
          font-weight: bold;
          color: #27ae60;
        }

        .progress-bar {
          width: 100%;
          height: 10px;
          background: #ecf0f1;
          border-radius: 5px;
          overflow: hidden;
          margin-bottom: 10px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #27ae60, #2ecc71);
          transition: width 0.3s ease;
        }

        .progress-text {
          color: #7f8c8d;
          font-size: 0.9rem;
          margin-bottom: 5px;
        }

        .bonus-text {
          color: #f39c12;
          font-weight: bold;
        }

        .remaining-tasks {
          color: #7f8c8d;
          font-size: 0.8rem;
          font-style: italic;
        }

        .max-level {
          background: #d4edda;
          color: #155724;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          font-weight: 500;
        }

        .set-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .set-info h3 {
          margin: 0;
          color: #2c3e50;
        }

        .task-count {
          color: #7f8c8d;
          font-weight: 500;
        }

        .set-actions {
          margin-top: 15px;
        }

        .set-complete, .all-sets-complete {
          background: #fff3cd;
          color: #856404;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
        }

        .all-sets-complete {
          background: #d4edda;
          color: #155724;
          display: flex;
          flex-direction: column;
          gap: 10px;
          align-items: center;
        }

        .withdraw-btn {
          background: #27ae60;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          font-weight: bold;
        }

        .withdraw-btn:hover {
          background: #219a52;
        }

        .activity-list {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          margin-bottom: 15px;
        }

        .activity-item {
          display: flex;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #ecf0f1;
          gap: 15px;
          transition: background 0.2s;
        }

        .activity-item:hover {
          background: #f8f9fa;
        }

        .activity-item:last-child {
          border-bottom: none;
        }

        .activity-icon {
          font-size: 1.5rem;
        }

        .activity-content {
          flex: 1;
        }

        .activity-content p {
          margin: 0;
        }

        .activity-content strong {
          color: #2c3e50;
        }

        .activity-description {
          color: #7f8c8d;
          font-size: 0.9rem;
        }

        .activity-time {
          color: #7f8c8d;
          font-size: 0.8rem;
        }

        .activity-amount {
          font-weight: bold;
          font-size: 16px;
        }

        .activity-amount.deposit {
          color: #27ae60;
        }

        .activity-amount.withdraw {
          color: #e74c3c;
        }

        .activity-amount.task {
          color: #3498db;
        }

        .activity-amount.bonus {
          color: #f39c12;
        }

        .no-activity {
          text-align: center;
          padding: 40px;
          color: #6c757d;
        }

        .no-activity .subtext {
          font-size: 14px;
          margin-top: 5px;
          opacity: 0.7;
        }

        .view-all-btn {
          width: 100%;
          padding: 12px;
          background: #3498db;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
          transition: background 0.3s;
        }

        .view-all-btn:hover {
          background: #2980b9;
        }

        /* Footer Styles */
        .dashboard-footer {
          background: #2c3e50;
          color: white;
          border-radius: 15px;
          overflow: hidden;
          margin-top: 40px;
        }

        .footer-content {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 30px;
          padding: 40px;
        }

        .footer-section h4 {
          color: #3498db;
          margin-bottom: 15px;
          font-size: 1.2rem;
        }

        .footer-section p {
          color: #bdc3c7;
          line-height: 1.6;
        }

        .footer-section ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .footer-section ul li {
          margin-bottom: 8px;
          color: #bdc3c7;
        }

        .footer-section ul li a {
          color: #bdc3c7;
          text-decoration: none;
          transition: color 0.3s;
        }

        .footer-section ul li a:hover {
          color: #3498db;
        }

        .footer-bottom {
          background: #34495e;
          padding: 20px;
          text-align: center;
          border-top: 1px solid #4a6572;
        }

        .footer-bottom p {
          margin: 0;
          color: #bdc3c7;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .user-dashboard {
            padding: 10px;
          }

          .welcome-section {
            padding: 20px;
          }

          .welcome-section h1 {
            font-size: 2rem;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .actions-grid {
            grid-template-columns: 1fr;
          }

          .action-card {
            padding: 20px;
          }

          .stat-card {
            padding: 20px;
          }

          .progress-card, .set-progress-card {
            padding: 20px;
          }

          .footer-content {
            grid-template-columns: 1fr;
            padding: 20px;
          }

          .set-info {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }

          .all-sets-complete {
            text-align: center;
          }
        }

        @media (max-width: 480px) {
          .welcome-section h1 {
            font-size: 1.5rem;
          }

          .stat-value {
            font-size: 1.5rem;
          }

          .action-content h3 {
            font-size: 1.1rem;
          }
        }
      `}</style>
        </Layout>
    );
}