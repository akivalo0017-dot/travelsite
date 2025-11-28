import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import TaskSurvey from '../../components/TaskSurvey';

export default function Booking() {
    const [user, setUser] = useState(null);
    const [currentSet, setCurrentSet] = useState(1);
    const [currentTask, setCurrentTask] = useState(1);
    const [taskCompleted, setTaskCompleted] = useState(0);
    const [showSurvey, setShowSurvey] = useState(false);
    const [showPremiumPopup, setShowPremiumPopup] = useState(false);
    const [premiumConfig, setPremiumConfig] = useState({ set: 1, task: 1, penalty: 5000, pendingAmount: 0 });
    const [wallet, setWallet] = useState({
        taskCount: 0,
        pointBalance: 0,
        pendingPoints: 0,
        todayPoints: 0,
        trialBonus: 10000
    });
    const [totalTasksCompleted, setTotalTasksCompleted] = useState(0);
    const router = useRouter();

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            router.push('/auth/login');
            return;
        }
        setUser(JSON.parse(userData));
        loadUserProgress();
        loadPremiumConfig();
        checkDailyReset();
    }, []);

    const loadUserProgress = () => {
        const savedProgress = JSON.parse(localStorage.getItem('bookingProgress') || '{}');
        setCurrentSet(savedProgress.currentSet || 1);
        setCurrentTask(savedProgress.currentTask || 1);
        setTaskCompleted(savedProgress.taskCompleted || 0);
        setTotalTasksCompleted(savedProgress.totalTasksCompleted || 0);

        const savedWallet = JSON.parse(localStorage.getItem('userWallet') || '{}');
        setWallet({
            taskCount: savedWallet.taskCount || 0,
            pointBalance: savedWallet.pointBalance || 0,
            pendingPoints: savedWallet.pendingPoints || 0,
            todayPoints: savedWallet.todayPoints || 0,
            trialBonus: savedWallet.trialBonus !== undefined ? savedWallet.trialBonus : 10000
        });
    };

    const loadPremiumConfig = () => {
        const savedPremium = JSON.parse(localStorage.getItem('premiumTask') || '{"set":1,"task":1,"penalty":5000,"pendingAmount":0}');
        setPremiumConfig(savedPremium);
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
            setWallet(updatedWallet);
        }
    };

    const saveUserProgress = (progress) => {
        localStorage.setItem('bookingProgress', JSON.stringify(progress));
    };

    const saveWallet = (walletData) => {
        localStorage.setItem('userWallet', JSON.stringify(walletData));
        setWallet(walletData);
    };

    const generateTaskPoints = () => {
        // Generate random points between 35.6 and 40.54
        const min = 35.6;
        const max = 40.54;
        return Math.random() * (max - min) + min;
    };

    const startBooking = () => {
        // Check if user can start booking
        if (wallet.pointBalance < 0) {
            alert('Cannot start booking with negative balance. Contact support.');
            return;
        }

        if (currentTask > 30) {
            alert('Please contact customer support to reset your bookings');
            return;
        }

        setShowSurvey(true);
    };

    const handleTaskComplete = (pointsEarned) => {
        const taskPoints = generateTaskPoints();
        const newTaskCompleted = taskCompleted + 1;
        const newTaskCount = wallet.taskCount + 1;
        const newTotalTasks = totalTasksCompleted + 1;

        // Calculate new balance (only task commissions for first-time users)
        const isFirstTime = wallet.trialBonus > 0;
        const commissionEarned = isFirstTime ? taskPoints : taskPoints;
        const newPointBalance = wallet.pointBalance + commissionEarned;

        // Deduct from trial bonus for first-time users
        const newTrialBonus = isFirstTime ? Math.max(0, wallet.trialBonus - (10000 / 30)) : wallet.trialBonus;

        // Check for premium task using admin configuration
        const isPremiumTask = currentSet === premiumConfig.set && currentTask === premiumConfig.task;

        if (isPremiumTask) {
            // Apply premium task effects
            const newWallet = {
                ...wallet,
                taskCount: newTaskCount,
                pointBalance: newPointBalance - premiumConfig.penalty,
                pendingPoints: wallet.pendingPoints + newPointBalance + premiumConfig.pendingAmount,
                todayPoints: (wallet.todayPoints || 0) + commissionEarned,
                trialBonus: newTrialBonus
            };
            saveWallet(newWallet);
            setShowPremiumPopup(true);
        } else {
            // Normal task completion
            const newWallet = {
                ...wallet,
                taskCount: newTaskCount,
                pointBalance: newPointBalance,
                todayPoints: (wallet.todayPoints || 0) + commissionEarned,
                trialBonus: newTrialBonus
            };
            saveWallet(newWallet);
        }

        // Update task progress
        const nextTask = currentTask + 1;
        let nextSet = currentSet;

        if (nextTask > 30) {
            if (currentSet < 3) {
                nextSet = currentSet + 1;
                setCurrentTask(1);
                setCurrentSet(nextSet);
            } else {
                // All 90 tasks completed
                setCurrentTask(31);
            }
        } else {
            setCurrentTask(nextTask);
        }

        setTaskCompleted(newTaskCompleted);
        setTotalTasksCompleted(newTotalTasks);

        const progress = {
            currentSet: nextSet,
            currentTask: nextTask > 30 ? 1 : nextTask,
            taskCompleted: newTaskCompleted,
            totalTasksCompleted: newTotalTasks
        };
        saveUserProgress(progress);

        setShowSurvey(false);
    };

    const getTaskMessage = () => {
        if (currentTask > 30 && currentSet < 3) {
            return "Contact customer support to reset your bookings for the next set";
        } else if (currentTask > 30 && currentSet === 3) {
            return "Congratulations! You've completed all 90 tasks. You can now withdraw your earnings.";
        }
        return `Set ${currentSet} - Task ${currentTask} of 30`;
    };

    const getProgressPercentage = () => {
        return (currentTask / 30) * 100;
    };

    const getLevelProgress = () => {
        const levels = [
            { level: 1, tasks: 150, name: "Level 1" },
            { level: 2, tasks: 300, name: "Level 2" },
            { level: 3, tasks: 450, name: "Level 3" },
            { level: 4, tasks: 600, name: "Agent Level" }
        ];

        const currentLevel = levels.find(level => totalTasksCompleted < level.tasks) || levels[levels.length - 1];
        const nextLevel = levels[levels.findIndex(level => level.tasks === currentLevel.tasks) + 1];

        if (!nextLevel) {
            return { current: currentLevel, next: null, progress: 100 };
        }

        const progress = ((totalTasksCompleted - currentLevel.tasks) / (nextLevel.tasks - currentLevel.tasks)) * 100;

        return {
            current: currentLevel,
            next: nextLevel,
            progress: Math.max(0, Math.min(100, progress))
        };
    };

    const levelProgress = getLevelProgress();

    const isBookingDisabled = wallet.pointBalance < 0 || currentTask > 30;

    return (
        <Layout>
            <div className="booking-container">
                <div className="booking-header">
                    <h1>Booking Tasks</h1>
                    <p className="task-message">{getTaskMessage()}</p>

                    {/* Level Progress */}
                    <div className="level-section">
                        <h3>Level Progress</h3>
                        <div className="level-info">
                            <span>Current: {levelProgress.current.name}</span>
                            {levelProgress.next && (
                                <>
                                    <span>Next: {levelProgress.next.name} ({levelProgress.next.tasks} tasks)</span>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{ width: `${levelProgress.progress}%` }}
                                        ></div>
                                    </div>
                                    <span>{Math.round(levelProgress.progress)}% to next level</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Current Set Progress */}
                    <div className="progress-section">
                        <h3>Current Set Progress</h3>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${getProgressPercentage()}%` }}
                            ></div>
                        </div>
                        <div className="progress-text">
                            {currentTask} / 30 tasks completed ({Math.round(getProgressPercentage())}%)
                        </div>
                    </div>

                    {/* Current Stats */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-value">Set {currentSet}/3</div>
                            <div className="stat-label">Current Set</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">{totalTasksCompleted}</div>
                            <div className="stat-label">Total Tasks</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">₹ {wallet.pointBalance.toFixed(2)}</div>
                            <div className="stat-label">Point Balance</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">₹ {wallet.pendingPoints.toFixed(2)}</div>
                            <div className="stat-label">Pending Amount</div>
                        </div>
                    </div>
                </div>

                <div className="booking-content">
                    {!showSurvey && (
                        <div className="start-booking-section">
                            <button
                                className={`start-booking-btn ${isBookingDisabled ? 'disabled' : ''}`}
                                onClick={startBooking}
                                disabled={isBookingDisabled}
                            >
                                {currentTask > 30 ? 'Awaiting Reset' : 'Start Booking'}
                            </button>

                            {wallet.pointBalance < 0 && (
                                <div className="warning-message">
                                    ⚠️ Your account has negative balance. Contact customer support to continue.
                                </div>
                            )}

                            {currentTask > 30 && currentSet < 3 && (
                                <div className="reset-message">
                                    🔄 You've completed all tasks in this set. Contact support to reset for the next set.
                                </div>
                            )}

                            {currentTask > 30 && currentSet === 3 && (
                                <div className="completion-message">
                                    🎉 All 90 tasks completed! You can now withdraw your earnings from the wallet page.
                                    <br />
                                    <button
                                        onClick={() => router.push('/user/wallet')}
                                        className="withdraw-redirect-btn"
                                    >
                                        Go to Wallet
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {showSurvey && (
                        <TaskSurvey
                            currentSet={currentSet}
                            currentTask={currentTask}
                            onComplete={handleTaskComplete}
                            onClose={() => setShowSurvey(false)}
                        />
                    )}
                </div>

                {/* Premium Task Popup */}
                {showPremiumPopup && (
                    <div className="popup-overlay">
                        <div className="premium-popup">
                            <div className="popup-header">
                                <h2>🎉 Congratulations!</h2>
                            </div>
                            <div className="popup-content">
                                <p>You got a <strong>Gold Suit X5 Commission!</strong></p>
                                <p>Contact customer support to claim your special bonus.</p>
                                <div className="premium-info">
                                    <p><strong>Important:</strong> Your account balance has been adjusted due to premium task completion.</p>
                                    <p>Current Balance: <strong>₹ {(wallet.pointBalance - premiumConfig.penalty).toFixed(2)}</strong></p>
                                    <p>Pending Amount: <strong>₹ {(wallet.pendingPoints + wallet.pointBalance + premiumConfig.pendingAmount).toFixed(2)}</strong></p>
                                    <p>You need to contact support to reset your balance and continue with tasks.</p>
                                </div>
                            </div>
                            <div className="popup-actions">
                                <button className="close-btn" onClick={() => setShowPremiumPopup(false)}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
        .booking-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }

        .booking-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .booking-header h1 {
          color: #2c3e50;
          margin-bottom: 10px;
        }

        .task-message {
          color: #7f8c8d;
          font-size: 18px;
          margin-bottom: 20px;
        }

        .level-section {
          background: white;
          padding: 20px;
          border-radius: 10px;
          margin: 20px 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .level-section h3 {
          color: #2c3e50;
          margin-bottom: 15px;
        }

        .level-info {
          display: flex;
          flex-direction: column;
          gap: 10px;
          align-items: center;
        }

        .level-info span {
          color: #7f8c8d;
          font-weight: 500;
        }

        .progress-section {
          margin: 20px 0;
        }

        .progress-bar {
          width: 100%;
          height: 20px;
          background: #ecf0f1;
          border-radius: 10px;
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
          font-size: 14px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
          margin: 30px 0;
        }

        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          text-align: center;
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

        .booking-content {
          background: white;
          border-radius: 15px;
          padding: 30px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }

        .start-booking-section {
          text-align: center;
        }

        .start-booking-btn {
          background: #3498db;
          color: white;
          border: none;
          padding: 20px 40px;
          font-size: 18px;
          font-weight: bold;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s;
          min-width: 200px;
        }

        .start-booking-btn:hover:not(.disabled) {
          background: #2980b9;
          transform: translateY(-2px);
        }

        .start-booking-btn.disabled {
          background: #bdc3c7;
          cursor: not-allowed;
        }

        .warning-message, .reset-message, .completion-message {
          padding: 15px;
          border-radius: 8px;
          margin-top: 20px;
          text-align: center;
        }

        .warning-message {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .reset-message {
          background: #fff3cd;
          color: #856404;
          border: 1px solid #ffeaa7;
        }

        .completion-message {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
          line-height: 1.6;
        }

        .withdraw-redirect-btn {
          background: #27ae60;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          margin-top: 10px;
          font-weight: bold;
        }

        .withdraw-redirect-btn:hover {
          background: #219a52;
        }

        /* Premium Popup Styles */
        .popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .premium-popup {
          background: white;
          border-radius: 15px;
          padding: 30px;
          max-width: 500px;
          width: 90%;
          text-align: center;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }

        .popup-header h2 {
          color: #f39c12;
          margin-bottom: 20px;
          font-size: 2rem;
        }

        .popup-content {
          margin-bottom: 25px;
        }

        .popup-content p {
          margin-bottom: 10px;
          color: #2c3e50;
          font-size: 16px;
        }

        .premium-info {
          background: #fff3cd;
          padding: 15px;
          border-radius: 8px;
          margin-top: 15px;
          text-align: left;
        }

        .premium-info p {
          color: #856404;
          margin: 5px 0;
          font-size: 14px;
        }

        .popup-actions {
          display: flex;
          gap: 15px;
          justify-content: center;
        }

        .close-btn {
          padding: 12px 25px;
          background: #95a5a6;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s;
          font-size: 16px;
        }

        .close-btn:hover {
          background: #7f8c8d;
          transform: translateY(-2px);
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .booking-container {
            padding: 10px;
          }

          .booking-content {
            padding: 20px;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .start-booking-btn {
            width: 100%;
            padding: 15px 30px;
          }

          .popup-actions {
            flex-direction: column;
          }

          .close-btn {
            width: 100%;
          }

          .premium-popup {
            padding: 20px;
          }

          .popup-header h2 {
            font-size: 1.5rem;
          }
        }

        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }

          .task-message {
            font-size: 16px;
          }
        }
      `}</style>
        </Layout>
    );
}