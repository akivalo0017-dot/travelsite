import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

export default function BookingHistory() {
    const [user, setUser] = useState(null);
    const [bookingHistory, setBookingHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            router.push('/auth/login');
            return;
        }
        setUser(JSON.parse(userData));
        loadBookingHistory();
        setLoading(false);
    }, []);

    const loadBookingHistory = () => {
        // Load booking history from localStorage or create sample data
        const savedHistory = JSON.parse(localStorage.getItem('bookingHistory') || '[]');

        if (savedHistory.length > 0) {
            setBookingHistory(savedHistory);
        } else {
            // Create sample booking history data
            const sampleHotels = [
                { name: 'Grand Plaza Hotel', image: '/hotels/hotel1.jpg', set: 1, task: 1 },
                { name: 'Sunset Resort', image: '/hotels/hotel2.jpg', set: 1, task: 2 },
                { name: 'Mountain View Inn', image: '/hotels/hotel3.jpg', set: 1, task: 3 },
                { name: 'Beach Paradise', image: '/hotels/hotel4.jpg', set: 1, task: 4 },
                { name: 'City Central Hotel', image: '/hotels/hotel5.jpg', set: 1, task: 5 },
            ];

            const sampleHistory = sampleHotels.map((hotel, index) => ({
                id: index + 1,
                hotelName: hotel.name,
                hotelImage: hotel.image,
                set: hotel.set,
                task: hotel.task,
                completedAt: new Date(Date.now() - (index * 24 * 60 * 60 * 1000)).toISOString(),
                pointsEarned: Math.floor(Math.random() * 6) + 35, // 35-40 points
                status: 'completed'
            }));

            setBookingHistory(sampleHistory);
            localStorage.setItem('bookingHistory', JSON.stringify(sampleHistory));
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed':
                return <span className="status-badge completed">Completed</span>;
            case 'pending':
                return <span className="status-badge pending">Pending</span>;
            default:
                return <span className="status-badge">Unknown</span>;
        }
    };

    if (loading) {
        return (
            <Layout>
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <p>Loading Booking History...</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="booking-history">
                <div className="header-section">
                    <h1>Booking History</h1>
                    <p>View all your completed hotel booking tasks</p>
                </div>

                <div className="stats-overview">
                    <div className="stat-card">
                        <div className="stat-number">{bookingHistory.length}</div>
                        <div className="stat-label">Total Bookings</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-number">
                            {bookingHistory.filter(booking => booking.status === 'completed').length}
                        </div>
                        <div className="stat-label">Completed</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-number">
                            {bookingHistory.reduce((sum, booking) => sum + booking.pointsEarned, 0)}
                        </div>
                        <div className="stat-label">Total Points</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-number">
                            {Math.max(...bookingHistory.map(b => b.set), 0)}
                        </div>
                        <div className="stat-label">Sets Completed</div>
                    </div>
                </div>

                <div className="bookings-list">
                    <h2>Your Completed Bookings</h2>

                    {bookingHistory.length === 0 ? (
                        <div className="no-bookings">
                            <div className="no-bookings-icon">📋</div>
                            <h3>No Bookings Yet</h3>
                            <p>Start completing booking tasks to see your history here</p>
                            <button
                                onClick={() => router.push('/user/booking')}
                                className="start-booking-btn"
                            >
                                Start Booking
                            </button>
                        </div>
                    ) : (
                        <div className="bookings-grid">
                            {bookingHistory.map(booking => (
                                <div key={booking.id} className="booking-card">
                                    <div className="booking-image">
                                        {/* Placeholder for hotel image */}
                                        <div className="image-placeholder">
                                            🏨
                                        </div>
                                    </div>
                                    <div className="booking-details">
                                        <h3 className="hotel-name">{booking.hotelName}</h3>
                                        <div className="booking-meta">
                                            <span className="set-task">Set {booking.set} • Task {booking.task}</span>
                                            <span className="completion-date">
                                                {new Date(booking.completedAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="booking-info">
                                            <div className="points-earned">
                                                <span className="points-label">Points Earned:</span>
                                                <span className="points-value">+{booking.pointsEarned}</span>
                                            </div>
                                            {getStatusBadge(booking.status)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <footer className="page-footer">
                    <div className="footer-content">
                        <p>&copy; 2024 One Travel Working. Your journey to earnings starts here.</p>
                    </div>
                </footer>
            </div>

            <style jsx>{`
        .booking-history {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          min-height: 80vh;
        }

        .header-section {
          text-align: center;
          margin-bottom: 40px;
          padding: 30px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 15px;
          color: white;
        }

        .header-section h1 {
          margin: 0 0 10px 0;
          font-size: 2.5rem;
        }

        .header-section p {
          margin: 0;
          opacity: 0.9;
          font-size: 1.1rem;
        }

        .stats-overview {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }

        .stat-card {
          background: white;
          padding: 25px;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          text-align: center;
          transition: transform 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-2px);
        }

        .stat-number {
          font-size: 2.5rem;
          font-weight: bold;
          color: #2c3e50;
          margin-bottom: 5px;
        }

        .stat-label {
          color: #7f8c8d;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .bookings-list h2 {
          color: #2c3e50;
          margin-bottom: 25px;
          font-size: 1.8rem;
        }

        .no-bookings {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 15px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .no-bookings-icon {
          font-size: 4rem;
          margin-bottom: 20px;
        }

        .no-bookings h3 {
          color: #2c3e50;
          margin-bottom: 10px;
          font-size: 1.5rem;
        }

        .no-bookings p {
          color: #7f8c8d;
          margin-bottom: 25px;
          font-size: 1.1rem;
        }

        .start-booking-btn {
          background: #3498db;
          color: white;
          border: none;
          padding: 15px 30px;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s;
        }

        .start-booking-btn:hover {
          background: #2980b9;
          transform: translateY(-2px);
        }

        .bookings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 25px;
        }

        .booking-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          transition: all 0.3s;
        }

        .booking-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 15px rgba(0, 0, 0, 0.15);
        }

        .booking-image {
          height: 150px;
          background: linear-gradient(135deg, #74b9ff, #0984e3);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .image-placeholder {
          font-size: 3rem;
          color: white;
        }

        .booking-details {
          padding: 20px;
        }

        .hotel-name {
          color: #2c3e50;
          margin: 0 0 10px 0;
          font-size: 1.3rem;
        }

        .booking-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 1px solid #ecf0f1;
        }

        .set-task {
          color: #3498db;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .completion-date {
          color: #7f8c8d;
          font-size: 0.8rem;
        }

        .booking-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .points-earned {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .points-label {
          color: #7f8c8d;
          font-size: 0.8rem;
        }

        .points-value {
          color: #27ae60;
          font-weight: bold;
          font-size: 1.1rem;
        }

        .status-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.8rem;
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

        .page-footer {
          margin-top: 50px;
          background: #2c3e50;
          color: white;
          border-radius: 10px;
          overflow: hidden;
        }

        .footer-content {
          padding: 20px;
          text-align: center;
        }

        .footer-content p {
          margin: 0;
          color: #bdc3c7;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .booking-history {
            padding: 10px;
          }

          .header-section {
            padding: 20px;
          }

          .header-section h1 {
            font-size: 2rem;
          }

          .stats-overview {
            grid-template-columns: repeat(2, 1fr);
          }

          .stat-card {
            padding: 20px;
          }

          .stat-number {
            font-size: 2rem;
          }

          .bookings-grid {
            grid-template-columns: 1fr;
          }

          .booking-meta {
            flex-direction: column;
            align-items: flex-start;
            gap: 5px;
          }
        }

        @media (max-width: 480px) {
          .header-section h1 {
            font-size: 1.5rem;
          }

          .stats-overview {
            grid-template-columns: 1fr;
          }

          .no-bookings {
            padding: 40px 15px;
          }

          .no-bookings-icon {
            font-size: 3rem;
          }
        }
      `}</style>
        </Layout>
    );
}