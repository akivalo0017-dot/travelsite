import Layout from '../components/Layout';

export default function Home() {
  return (
    <Layout>
      <div className="hero">
        <h1>Welcome to TravelBook</h1>
        <p>Your one-stop solution for travel and hotel bookings</p>
        <div className="features">
          <div className="feature-card">
            <h3>Easy Booking</h3>
            <p>Book hotels and travel packages with ease</p>
          </div>
          <div className="feature-card">
            <h3>Earn Points</h3>
            <p>Complete tasks and earn reward points</p>
          </div>
          <div className="feature-card">
            <h3>Secure Payments</h3>
            <p>Safe and secure payment processing</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .hero {
          text-align: center;
          padding: 50px 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .hero h1 {
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        .features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 30px;
          margin-top: 50px;
          max-width: 1200px;
          margin-left: auto;
          margin-right: auto;
        }
        .feature-card {
          background: rgba(255,255,255,0.1);
          padding: 30px;
          border-radius: 10px;
          backdrop-filter: blur(10px);
        }
        .feature-card h3 {
          font-size: 1.5rem;
          margin-bottom: 1rem;
        }
      `}</style>
    </Layout>
  );
}