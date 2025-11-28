import { useState } from 'react';

// Sample hotel data - replace with actual 90 hotels later
const hotelData = [
    { id: 1, name: 'Grand Plaza Hotel', image: '/hotels/hotel1.jpg' },
    { id: 2, name: 'Sunset Resort & Spa', image: '/hotels/hotel2.jpg' },
    { id: 3, name: 'Mountain View Inn', image: '/hotels/hotel3.jpg' },
    { id: 4, name: 'Beach Paradise Resort', image: '/hotels/hotel4.jpg' },
    { id: 5, name: 'City Central Hotel', image: '/hotels/hotel5.jpg' },
    { id: 6, name: 'Royal Heritage Palace', image: '/hotels/hotel6.jpg' },
    { id: 7, name: 'Lakeside Retreat', image: '/hotels/hotel7.jpg' },
    { id: 8, name: 'Business Tower Hotel', image: '/hotels/hotel8.jpg' },
    { id: 9, name: 'Garden Oasis Resort', image: '/hotels/hotel9.jpg' },
    { id: 10, name: 'Skyline Luxury Suites', image: '/hotels/hotel10.jpg' },
    // Add more hotels up to 90...
];

export default function TaskSurvey({ currentSet, currentTask, onComplete, onClose }) {
    const [selectedAnswer, setSelectedAnswer] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Get hotel for current task (cycle through available hotels)
    const hotelIndex = ((currentSet - 1) * 30 + (currentTask - 1)) % hotelData.length;
    const hotel = hotelData[hotelIndex];

    // Calculate total tasks completed so far
    const totalTasksCompleted = (currentSet - 1) * 30 + (currentTask - 1);

    // Answer options - will update later as per requirements
    const answers = [
        { id: 'excellent', label: 'Excellent - Outstanding service and facilities' },
        { id: 'good', label: 'Good - Met expectations with good service' },
        { id: 'average', label: 'Average - Basic but acceptable experience' },
        { id: 'poor', label: 'Poor - Below expectations, needs improvement' },
        { id: 'terrible', label: 'Terrible - Very disappointing experience' }
    ];

    const handleSubmit = async () => {
        if (!selectedAnswer) {
            alert('Please select your experience rating');
            return;
        }

        setIsSubmitting(true);

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Generate random points between 35.6-40.54
        const minPoints = 35.6;
        const maxPoints = 40.54;
        const pointsEarned = Math.random() * (maxPoints - minPoints) + minPoints;

        // Complete the task
        onComplete(pointsEarned);

        setIsSubmitting(false);
    };

    return (
        <div className="survey-container">
            <div className="survey-header">
                <div className="header-left">
                    <h2>Set {currentSet} - Task {currentTask}</h2>
                    <div className="total-tasks">
                        Total Tasks: {totalTasksCompleted}/450
                    </div>
                </div>
                <button className="close-button" onClick={onClose}>×</button>
            </div>

            <div className="survey-content">
                {/* Hotel Information Section */}
                <div className="hotel-section">
                    <div className="hotel-image">
                        <div className="image-placeholder">
                            🏨
                            <div className="hotel-badge">Hotel</div>
                        </div>
                    </div>
                    <div className="hotel-info">
                        <h3 className="hotel-name">{hotel?.name || `HotelName${currentTask.toString().padStart(2, '0')}`}</h3>
                        <div className="hotel-meta">
                            <span className="task-info">Set {currentSet} • Task {currentTask}</span>
                            <span className="rating-prompt">Share your experience</span>
                        </div>
                    </div>
                </div>

                {/* Question Section */}
                <div className="question-section">
                    <p className="question-text">
                        Please select your experience for this hotel:
                    </p>
                </div>

                {/* Answers Section */}
                <div className="answers-section">
                    {answers.map((answer) => (
                        <label key={answer.id} className="answer-option">
                            <input
                                type="radio"
                                name="hotel-experience"
                                value={answer.id}
                                checked={selectedAnswer === answer.id}
                                onChange={(e) => setSelectedAnswer(e.target.value)}
                                disabled={isSubmitting}
                            />
                            <span className="answer-label">{answer.label}</span>
                        </label>
                    ))}
                </div>

                {/* Progress Info */}
                <div className="progress-info">
                    <div className="set-progress">
                        <span>Set Progress: {currentTask}/30 tasks</span>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${(currentTask / 30) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                    <div className="total-progress">
                        <span>Overall Progress: {totalTasksCompleted}/450 tasks</span>
                        <div className="progress-bar">
                            <div
                                className="progress-fill total"
                                style={{ width: `${(totalTasksCompleted / 450) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                <div className="survey-footer">
                    <div className="task-info">
                        <span>Set {currentSet} of 3 • Task {currentTask} of 30</span>
                        <span className="points-info">Earns: 35.6 - 40.54 points</span>
                    </div>
                    <button
                        className="review-button"
                        onClick={handleSubmit}
                        disabled={!selectedAnswer || isSubmitting}
                    >
                        {isSubmitting ? 'Processing...' : 'Submit Review'}
                    </button>
                </div>
            </div>

            <style jsx>{`
        .survey-container {
          background: white;
          border-radius: 15px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          max-width: 600px;
          margin: 0 auto;
        }

        .survey-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 30px;
          background: linear-gradient(135deg, #3498db, #2980b9);
          color: white;
        }

        .header-left h2 {
          margin: 0;
          font-size: 1.5rem;
        }

        .total-tasks {
          font-size: 0.9rem;
          opacity: 0.9;
          margin-top: 5px;
          background: rgba(255,255,255,0.2);
          padding: 4px 8px;
          border-radius: 12px;
          font-weight: 500;
        }

        .close-button {
          background: none;
          border: none;
          color: white;
          font-size: 2rem;
          cursor: pointer;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.3s;
        }

        .close-button:hover {
          opacity: 0.8;
        }

        .survey-content {
          padding: 30px;
        }

        /* Hotel Section */
        .hotel-section {
          display: flex;
          gap: 20px;
          margin-bottom: 25px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 10px;
          border: 1px solid #e9ecef;
        }

        .hotel-image {
          flex-shrink: 0;
        }

        .image-placeholder {
          width: 100px;
          height: 100px;
          background: linear-gradient(135deg, #74b9ff, #0984e3);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          color: white;
          position: relative;
        }

        .hotel-badge {
          position: absolute;
          bottom: 5px;
          background: rgba(0,0,0,0.7);
          color: white;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 0.7rem;
        }

        .hotel-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .hotel-name {
          color: #2c3e50;
          margin: 0 0 8px 0;
          font-size: 1.3rem;
          font-weight: bold;
        }

        .hotel-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .task-info {
          color: #7f8c8d;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .rating-prompt {
          color: #3498db;
          font-size: 0.9rem;
          font-weight: 600;
        }

        /* Question Section */
        .question-section {
          text-align: center;
          margin-bottom: 25px;
        }

        .question-text {
          color: #2c3e50;
          font-size: 18px;
          font-weight: 600;
          margin: 0;
        }

        /* Answers Section */
        .answers-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 25px;
        }

        .answer-option {
          display: flex;
          align-items: center;
          padding: 15px 20px;
          border: 2px solid #e1e8ed;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s;
          background: white;
        }

        .answer-option:hover {
          border-color: #3498db;
          background: #f8f9fa;
          transform: translateY(-1px);
        }

        .answer-option input {
          margin-right: 15px;
          transform: scale(1.2);
        }

        .answer-label {
          font-size: 16px;
          color: #2c3e50;
          flex: 1;
        }

        .answer-option input:checked + .answer-label {
          color: #3498db;
          font-weight: bold;
        }

        .answer-option input:checked ~ .answer-label {
          color: #3498db;
          font-weight: bold;
        }

        /* Progress Info */
        .progress-info {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .set-progress, .total-progress {
          margin-bottom: 12px;
        }

        .set-progress:last-child, .total-progress:last-child {
          margin-bottom: 0;
        }

        .set-progress span, .total-progress span {
          display: block;
          color: #2c3e50;
          font-size: 14px;
          margin-bottom: 5px;
          font-weight: 500;
        }

        .progress-bar {
          width: 100%;
          height: 6px;
          background: #e9ecef;
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #27ae60, #2ecc71);
          transition: width 0.3s ease;
        }

        .progress-fill.total {
          background: linear-gradient(90deg, #3498db, #2980b9);
        }

        /* Survey Footer */
        .survey-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 20px;
          border-top: 1px solid #ecf0f1;
        }

        .task-info {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .task-info span {
          color: #7f8c8d;
          font-size: 14px;
        }

        .points-info {
          color: #27ae60 !important;
          font-weight: 600;
        }

        .review-button {
          background: #27ae60;
          color: white;
          border: none;
          padding: 12px 30px;
          font-size: 16px;
          font-weight: bold;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s;
          min-width: 140px;
        }

        .review-button:hover:not(:disabled) {
          background: #219a52;
          transform: translateY(-2px);
        }

        .review-button:disabled {
          background: #bdc3c7;
          cursor: not-allowed;
          transform: none;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .survey-header {
            padding: 15px 20px;
          }

          .header-left h2 {
            font-size: 1.3rem;
          }

          .survey-content {
            padding: 20px;
          }

          .hotel-section {
            flex-direction: column;
            text-align: center;
            gap: 15px;
          }

          .hotel-meta {
            flex-direction: column;
            gap: 8px;
          }

          .survey-footer {
            flex-direction: column;
            gap: 15px;
            text-align: center;
          }

          .review-button {
            width: 100%;
          }

          .total-tasks {
            font-size: 0.8rem;
          }
        }

        @media (max-width: 480px) {
          .survey-container {
            margin: 10px;
          }

          .hotel-name {
            font-size: 1.1rem;
          }

          .question-text {
            font-size: 16px;
          }

          .answer-label {
            font-size: 14px;
          }

          .task-info span {
            font-size: 12px;
          }
        }
      `}</style>
        </div>
    );
}