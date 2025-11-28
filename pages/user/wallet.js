import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

export default function Wallet() {
    const [user, setUser] = useState(null);
    const [wallet, setWallet] = useState({
        taskCount: 0,
        pointBalance: 0,
        pendingPoints: 0,
        todayPoints: 0,
        trialBonus: 10000,
        totalDeposit: 0,
        totalWithdraw: 0
    });
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [showWithdrawInput, setShowWithdrawInput] = useState(false);
    const [transactionHistory, setTransactionHistory] = useState([]);
    const [filter, setFilter] = useState('none');
    const [withdrawalRules, setWithdrawalRules] = useState({
        allowWithoutCompletion: false,
        minBalance: 0,
        depositLink: 'https://your-deposit-link.com'
    });
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            router.push('/auth/login');
            return;
        }
        setUser(JSON.parse(userData));
        loadWalletData();
        loadTransactionHistory();
        loadWithdrawalRules();
        checkDailyReset();
        setLoading(false);
    }, []);

    const loadWalletData = () => {
        const savedWallet = JSON.parse(localStorage.getItem('userWallet') || '{}');
        const savedProgress = JSON.parse(localStorage.getItem('bookingProgress') || '{}');

        setWallet({
            taskCount: savedWallet.taskCount || savedProgress.taskCompleted || 0,
            pointBalance: savedWallet.pointBalance || 0,
            pendingPoints: savedWallet.pendingPoints || 0,
            todayPoints: savedWallet.todayPoints || 0,
            trialBonus: savedWallet.trialBonus !== undefined ? savedWallet.trialBonus : 10000,
            totalDeposit: savedWallet.totalDeposit || 0,
            totalWithdraw: savedWallet.totalWithdraw || 0
        });
    };

    const checkDailyReset = () => {
        const lastReset = localStorage.getItem('lastDailyReset');
        const today = new Date().toDateString();

        if (lastReset !== today) {
            // Reset today's points
            const savedWallet = JSON.parse(localStorage.getItem('userWallet') || '{}');
            const updatedWallet = {
                ...savedWallet,
                todayPoints: 0
            };
            localStorage.setItem('userWallet', JSON.stringify(updatedWallet));
            localStorage.setItem('lastDailyReset', today);
            setWallet(prev => ({ ...prev, todayPoints: 0 }));
        }
    };

    const loadWithdrawalRules = () => {
        const rules = JSON.parse(localStorage.getItem('withdrawalRules') || '{"allowWithoutCompletion":false,"minBalance":0,"depositLink":"https://your-deposit-link.com"}');
        setWithdrawalRules(rules);
    };

    const loadTransactionHistory = () => {
        const savedHistory = JSON.parse(localStorage.getItem('transactionHistory') || '[]');
        if (savedHistory.length > 0) {
            setTransactionHistory(savedHistory);
        } else {
            // Default mock data for new users
            const mockHistory = [
                { id: 1, date: new Date().toISOString().split('T')[0], type: 'bonus', amount: 10000, status: 'completed', description: 'Trial Bonus' },
                { id: 2, date: new Date().toISOString().split('T')[0], type: 'task', amount: 38, status: 'completed', description: 'Task Commission' }
            ];
            setTransactionHistory(mockHistory);
            localStorage.setItem('transactionHistory', JSON.stringify(mockHistory));
        }
    };

    const handleDeposit = () => {
        // Open deposit link from admin settings
        window.open(withdrawalRules.depositLink, '_blank');

        // Add deposit transaction to history
        const newTransaction = {
            id: Date.now(),
            date: new Date().toISOString().split('T')[0],
            type: 'deposit',
            amount: 0, // Actual amount will be added by admin
            status: 'pending',
            description: 'Deposit Request'
        };

        const updatedHistory = [newTransaction, ...transactionHistory];
        setTransactionHistory(updatedHistory);
        localStorage.setItem('transactionHistory', JSON.stringify(updatedHistory));

        alert('Deposit link opened. Contact admin after depositing.');
    };

    const handleWithdrawRequest = () => {
        const amount = parseFloat(withdrawAmount);

        // Validation checks
        if (!amount || amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        const availableBalance = getAvailableBalance();
        if (amount > availableBalance) {
            alert(`Withdrawal amount cannot exceed your available balance of ₹${availableBalance}`);
            return;
        }

        if (wallet.pointBalance < 0) {
            alert('Cannot withdraw with negative balance. Contact support.');
            return;
        }

        if (amount < withdrawalRules.minBalance) {
            alert(`Minimum withdrawal amount is ₹${withdrawalRules.minBalance}`);
            return;
        }

        // Check withdrawal eligibility
        if (!canWithdraw()) {
            alert(getWithdrawalMessage());
            return;
        }

        // Process withdrawal request
        const newBalance = wallet.pointBalance - amount;
        const updatedWallet = {
            ...wallet,
            pointBalance: newBalance,
            totalWithdraw: (wallet.totalWithdraw || 0) + amount
        };

        // Update local storage
        localStorage.setItem('userWallet', JSON.stringify(updatedWallet));
        setWallet(updatedWallet);
        setWithdrawAmount('');
        setShowWithdrawInput(false);

        // Add to transaction history
        const newTransaction = {
            id: Date.now(),
            date: new Date().toISOString().split('T')[0],
            type: 'withdraw',
            amount: amount,
            status: 'pending',
            description: 'Withdrawal Request'
        };

        const updatedHistory = [newTransaction, ...transactionHistory];
        setTransactionHistory(updatedHistory);
        localStorage.setItem('transactionHistory', JSON.stringify(updatedHistory));

        // Save withdrawal request for admin
        const withdrawalRequests = JSON.parse(localStorage.getItem('withdrawalRequests') || '[]');
        withdrawalRequests.push({
            id: newTransaction.id,
            userId: user?.id,
            userName: user?.name,
            amount: amount,
            date: new Date().toISOString(),
            status: 'pending'
        });
        localStorage.setItem('withdrawalRequests', JSON.stringify(withdrawalRequests));

        alert(`Withdrawal request of ₹${amount} submitted successfully! Waiting for admin approval.`);
    };

    const getAvailableBalance = () => {
        // For first-time users, only task commissions are withdrawable (not trial bonus)
        if (wallet.trialBonus > 0) {
            return Math.max(0, wallet.pointBalance - wallet.trialBonus);
        }
        return wallet.pointBalance;
    };

    const canWithdraw = () => {
        const isFirstTime = wallet.trialBonus > 0;
        const completedSets = Math.floor(wallet.taskCount / 30);

        // First-time users can withdraw after 1 set (30 tasks)
        if (isFirstTime) {
            return completedSets >= 1;
        }

        // Regular users need 3 sets (90 tasks) unless admin overrides
        if (!withdrawalRules.allowWithoutCompletion) {
            return completedSets >= 3;
        }

        return true;
    };

    const getWithdrawalMessage = () => {
        if (wallet.pointBalance < 0) {
            return "Negative balance detected. Contact customer support.";
        }

        const isFirstTime = wallet.trialBonus > 0;
        const completedSets = Math.floor(wallet.taskCount / 30);
        const remainingSets = isFirstTime ? 1 - completedSets : 3 - completedSets;

        if (remainingSets > 0) {
            return `Complete ${remainingSets} more set${remainingSets > 1 ? 's' : ''} to enable withdrawal`;
        }

        if (getAvailableBalance() < withdrawalRules.minBalance) {
            return `Minimum withdrawal amount is ₹${withdrawalRules.minBalance}`;
        }

        return "You can withdraw your earnings";
    };

    const getCurrentSet = () => {
        return Math.ceil(wallet.taskCount / 30) || 1;
    };

    const filteredTransactions = transactionHistory.filter(transaction => {
        if (filter === 'none') return true;
        return transaction.type === filter;
    });

    const getLevelProgress = () => {
        const totalTasks = wallet.taskCount || 0;
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

    if (loading) {
        return (
            <Layout>
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <p>Loading Wallet...</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="wallet-container">
                {/* Main Wallet Section */}
                <div className="wallet-section">
                    <div className="task-count-section">
                        <h1 className="task-count">Task Count: {wallet.taskCount}/90</h1>
                        <p className="current-set">Current Set: {getCurrentSet()}/3</p>
                        <p className="reservation-info">
                            Complete tasks to unlock withdrawal eligibility
                        </p>
                    </div>

                    <div className="amounts-grid">
                        <div className="amount-card">
                            <div className="amount">₹ {wallet.trialBonus.toFixed(2)}</div>
                            <div className="label">Trial Bonus</div>

                        </div>
                        <div className="amount-card">
                            <div className="amount">₹ {wallet.todayPoints.toFixed(2)}</div>
                            <div className="label">Today Commission</div>

                        </div>
                        <div className="amount-card">
                            <div className="amount">₹ {wallet.pointBalance.toFixed(2)}</div>
                            <div className="label">Balance</div>
                            <div className="">
                            </div>
                        </div>
                        <div className="amount-card">
                            <div className="amount">₹ {wallet.pendingPoints.toFixed(2)}</div>
                            <div className="label">Pending Amount</div>

                        </div>
                    </div>

                    <div className="action-buttons">
                        <button className="deposit-btn" onClick={handleDeposit}>
                            Deposit
                        </button>
                        <button
                            className={`withdraw-btn ${!canWithdraw() ? 'disabled' : ''}`}
                            onClick={() => setShowWithdrawInput(true)}
                            disabled={!canWithdraw()}
                        >
                            Withdraw
                        </button>
                    </div>

                    {/* Withdrawal Information */}
                    <div className={`withdraw-info ${canWithdraw() ? 'success' : 'warning'}`}>
                        <p>{getWithdrawalMessage()}</p>
                    </div>

                    {/* Withdrawal Amount Input */}
                    {showWithdrawInput && canWithdraw() && (
                        <div className="withdraw-input-section">
                            <label>Withdrawal Amount (Max: ₹{getAvailableBalance().toFixed(2)}):</label>
                            <div className="input-group">
                                <input
                                    type="number"
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    placeholder="Enter amount"
                                    max={getAvailableBalance()}
                                    min="1"
                                    className="withdraw-input"
                                />
                                <button
                                    className="max-btn"
                                    onClick={() => setWithdrawAmount(getAvailableBalance().toFixed(2))}
                                >
                                    MAX
                                </button>
                            </div>
                            <div className="amount-buttons">
                                <button onClick={() => setWithdrawAmount('1000')}>₹1,000</button>
                                <button onClick={() => setWithdrawAmount('5000')}>₹5,000</button>
                                <button onClick={() => setWithdrawAmount('10000')}>₹10,000</button>
                            </div>
                            <div className="withdraw-actions">
                                <button
                                    className="confirm-btn"
                                    onClick={handleWithdrawRequest}
                                    disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0}
                                >
                                    Submit Withdrawal Request
                                </button>
                                <button
                                    className="cancel-btn"
                                    onClick={() => {
                                        setShowWithdrawInput(false);
                                        setWithdrawAmount('');
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Level Progress */}
                    <div className="level-section">
                        <h3>Level Progress</h3>
                        <div className="level-info">
                            <div className="level-current">
                                <strong>Current: {levelProgress.current.name}</strong>
                                {levelProgress.current.bonus > 0 && (
                                    <span>Bonus: ₹{levelProgress.current.bonus}</span>
                                )}
                            </div>
                            {levelProgress.next && (
                                <div className="level-next">
                                    <div className="progress-header">
                                        <span>Next: {levelProgress.next.name}</span>
                                        <span>{levelProgress.remaining} tasks remaining</span>
                                    </div>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{ width: `${levelProgress.progress}%` }}
                                        ></div>
                                    </div>
                                    <div className="progress-text">
                                        {Math.round(levelProgress.progress)}% complete
                                        {levelProgress.next.bonus > 0 && (
                                            <span className="bonus-text"> • ₹{levelProgress.next.bonus} bonus</span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="quick-stats">
                    <div className="stat-item">
                        <div className="stat-value">{wallet.taskCount}</div>
                        <div className="stat-label">Tasks Completed</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-value">{90 - wallet.taskCount}</div>
                        <div className="stat-label">Tasks Remaining</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-value">
                            {canWithdraw() ? 'Yes' : 'No'}
                        </div>
                        <div className="stat-label">Can Withdraw</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-value">{getCurrentSet()}/3</div>
                        <div className="stat-label">Current Set</div>
                    </div>
                </div>

                {/* Transaction History */}
                <div className="transaction-section">
                    <h2>Transaction History</h2>

                    <div className="filter-buttons">
                        <button
                            className={filter === 'none' ? 'active' : ''}
                            onClick={() => setFilter('none')}
                        >
                            All
                        </button>
                        <button
                            className={filter === 'deposit' ? 'active' : ''}
                            onClick={() => setFilter('deposit')}
                        >
                            Deposit
                        </button>
                        <button
                            className={filter === 'withdraw' ? 'active' : ''}
                            onClick={() => setFilter('withdraw')}
                        >
                            Withdraw
                        </button>
                        <button
                            className={filter === 'task' ? 'active' : ''}
                            onClick={() => setFilter('task')}
                        >
                            Tasks
                        </button>
                        <button
                            className={filter === 'bonus' ? 'active' : ''}
                            onClick={() => setFilter('bonus')}
                        >
                            Bonus
                        </button>
                    </div>

                    <div className="transaction-list">
                        {filteredTransactions.length > 0 ? (
                            filteredTransactions.map(transaction => (
                                <div key={transaction.id} className="transaction-item">
                                    <div className="transaction-left">
                                        <div className="transaction-type">
                                            {transaction.type === 'deposit' && '💰 Deposit'}
                                            {transaction.type === 'withdraw' && '💳 Withdrawal'}
                                            {transaction.type === 'task' && '📊 Task Commission'}
                                            {transaction.type === 'bonus' && '🎁 Bonus'}
                                        </div>
                                        <div className="transaction-description">
                                            {transaction.description || 'Transaction'}
                                        </div>
                                        <div className="transaction-date">{transaction.date}</div>
                                    </div>
                                    <div className="transaction-right">
                                        <div className={`transaction-amount ${transaction.type} ${transaction.status}`}>
                                            {transaction.type === 'withdraw' ? '-' : '+'}₹ {transaction.amount.toLocaleString()}
                                        </div>
                                        <div className="transaction-status">
                                            <span className={`status-badge ${transaction.status}`}>
                                                {transaction.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-transactions">
                                <p>No transactions found</p>
                                <p className="subtext">Your transaction history will appear here</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
        .wallet-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }

        .wallet-section {
          background: white;
          border-radius: 15px;
          padding: 30px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          margin-bottom: 20px;
        }

        .task-count-section {
          text-align: center;
          margin-bottom: 30px;
        }

        .task-count {
          font-size: 2rem;
          color: #2c3e50;
          margin-bottom: 5px;
        }

        .current-set {
          color: #7f8c8d;
          font-size: 16px;
          margin-bottom: 10px;
        }

        .reservation-info {
          color: #7f8c8d;
          font-size: 14px;
        }

        .amounts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .amount-card {
          text-align: center;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 10px;
          border: 2px solid #e9ecef;
          transition: transform 0.2s;
        }

        .amount-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }

        .amount {
          font-size: 1.5rem;
          font-weight: bold;
          color: #27ae60;
          margin-bottom: 5px;
        }

        .label {
          color: #2c3e50;
          font-weight: 600;
          margin-bottom: 2px;
        }

        .sub-label {
          color: #6c757d;
          font-size: 12px;
        }

        .sub-label.available {
          color: #27ae60;
          font-weight: 600;
        }

        .action-buttons {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
          justify-content: center;
        }

        .deposit-btn, .withdraw-btn {
          padding: 15px 30px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s;
          min-width: 120px;
        }

        .deposit-btn {
          background: #3498db;
          color: white;
        }

        .deposit-btn:hover {
          background: #2980b9;
          transform: translateY(-2px);
        }

        .withdraw-btn {
          background: #27ae60;
          color: white;
        }

        .withdraw-btn:hover:not(.disabled) {
          background: #219a52;
          transform: translateY(-2px);
        }

        .withdraw-btn.disabled {
          background: #bdc3c7;
          cursor: not-allowed;
          transform: none;
        }

        .withdraw-info {
          text-align: center;
          padding: 15px;
          margin: 10px 0;
          border-radius: 8px;
          font-weight: 500;
        }

        .withdraw-info.warning {
          background: #fff3cd;
          color: #856404;
          border: 1px solid #ffeaa7;
        }

        .withdraw-info.success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .withdraw-input-section {
          text-align: center;
          margin: 20px 0;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 10px;
        }

        .withdraw-input-section label {
          display: block;
          margin-bottom: 15px;
          color: #2c3e50;
          font-weight: bold;
          font-size: 16px;
        }

        .input-group {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
          margin-bottom: 15px;
        }

        .withdraw-input {
          padding: 12px 15px;
          border: 2px solid #ddd;
          border-radius: 8px;
          font-size: 16px;
          width: 200px;
          text-align: center;
          font-weight: bold;
        }

        .withdraw-input:focus {
          outline: none;
          border-color: #3498db;
          box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
        }

        .max-btn {
          padding: 12px 20px;
          background: #95a5a6;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
          transition: background 0.3s;
        }

        .max-btn:hover {
          background: #7f8c8d;
        }

        .amount-buttons {
          display: flex;
          gap: 10px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 15px;
        }

        .amount-buttons button {
          padding: 8px 15px;
          background: #e3f2fd;
          color: #1976d2;
          border: 2px solid #bbdefb;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
          transition: all 0.3s;
        }

        .amount-buttons button:hover {
          background: #1976d2;
          color: white;
        }

        .withdraw-actions {
          display: flex;
          gap: 10px;
          justify-content: center;
        }

        .confirm-btn, .cancel-btn {
          padding: 12px 20px;
          border: none;
          border-radius: 6px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s;
        }

        .confirm-btn {
          background: #27ae60;
          color: white;
        }

        .confirm-btn:hover:not(:disabled) {
          background: #219a52;
        }

        .confirm-btn:disabled {
          background: #bdc3c7;
          cursor: not-allowed;
        }

        .cancel-btn {
          background: #95a5a6;
          color: white;
        }

        .cancel-btn:hover {
          background: #7f8c8d;
        }

        .level-section {
          margin-top: 30px;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 10px;
          color: white;
        }

        .level-section h3 {
          margin-bottom: 15px;
          text-align: center;
        }

        .level-info {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .level-current, .level-next {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .level-current {
          text-align: center;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: rgba(255,255,255,0.3);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 5px;
        }

        .progress-fill {
          height: 100%;
          background: #2ecc71;
          transition: width 0.3s ease;
        }

        .progress-text {
          font-size: 12px;
          opacity: 0.9;
        }

        .bonus-text {
          color: #f39c12;
          font-weight: bold;
        }

        .quick-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .stat-item {
          background: white;
          padding: 20px;
          border-radius: 10px;
          text-align: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: bold;
          color: #2c3e50;
          margin-bottom: 5px;
        }

        .stat-label {
          color: #7f8c8d;
          font-size: 12px;
        }

        .transaction-section {
          background: white;
          border-radius: 15px;
          padding: 30px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .transaction-section h2 {
          margin-bottom: 20px;
          color: #2c3e50;
          text-align: center;
        }

        .filter-buttons {
          display: flex;
          gap: 10px;
          margin-bottom: 25px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .filter-buttons button {
          padding: 10px 20px;
          border: 2px solid #3498db;
          background: white;
          color: #3498db;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.3s;
          font-weight: 500;
        }

        .filter-buttons button.active {
          background: #3498db;
          color: white;
        }

        .filter-buttons button:hover:not(.active) {
          background: #e3f2fd;
        }

        .transaction-list {
          max-height: 400px;
          overflow-y: auto;
        }

        .transaction-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          border-bottom: 1px solid #ecf0f1;
          transition: background 0.2s;
        }

        .transaction-item:hover {
          background: #f8f9fa;
        }

        .transaction-left {
          flex: 1;
        }

        .transaction-type {
          text-transform: capitalize;
          font-weight: bold;
          color: #2c3e50;
          margin-bottom: 5px;
        }

        .transaction-description {
          color: #7f8c8d;
          font-size: 14px;
          margin-bottom: 3px;
        }

        .transaction-date {
          color: #7f8c8d;
          font-size: 12px;
        }

        .transaction-right {
          text-align: right;
        }

        .transaction-amount {
          font-weight: bold;
          font-size: 16px;
          margin-bottom: 5px;
        }

        .transaction-amount.deposit {
          color: #27ae60;
        }

        .transaction-amount.withdraw {
          color: #e74c3c;
        }

        .transaction-amount.task {
          color: #3498db;
        }

        .transaction-amount.bonus {
          color: #f39c12;
        }

        .transaction-amount.pending {
          opacity: 0.6;
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: bold;
          text-transform: uppercase;
        }

        .status-badge.completed {
          background: #d4edda;
          color: #155724;
        }

        .status-badge.pending {
          background: #fff3cd;
          color: #856404;
        }

        .no-transactions {
          text-align: center;
          padding: 40px;
          color: #6c757d;
        }

        .no-transactions .subtext {
          font-size: 14px;
          margin-top: 5px;
          opacity: 0.7;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .wallet-container {
            padding: 10px;
          }

          .wallet-section {
            padding: 20px;
          }

          .task-count {
            font-size: 1.5rem;
          }

          .amounts-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
          }

          .amount-card {
            padding: 15px;
          }

          .amount {
            font-size: 1.2rem;
          }

          .action-buttons {
            flex-direction: column;
          }

          .deposit-btn, .withdraw-btn {
            width: 100%;
          }

          .input-group {
            flex-direction: column;
          }

          .withdraw-input {
            width: 100%;
          }

          .amount-buttons {
            flex-direction: column;
          }

          .amount-buttons button {
            width: 100%;
          }

          .withdraw-actions {
            flex-direction: column;
          }

          .quick-stats {
            grid-template-columns: repeat(2, 1fr);
          }

          .transaction-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }

          .transaction-right {
            text-align: left;
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
        }

        @media (max-width: 480px) {
          .amounts-grid {
            grid-template-columns: 1fr;
          }

          .quick-stats {
            grid-template-columns: repeat(2, 1fr);
          }

          .filter-buttons {
            flex-direction: column;
          }

          .filter-buttons button {
            width: 100%;
          }
        }
      `}</style>
        </Layout>
    );
}