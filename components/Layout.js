import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function Layout({ children }) {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/');
  };

  return (
    <div>
      <header className="header">
        <div className="logo">TravelBook</div>
        <nav>
          {user ? (
            <div className="user-menu">
              <span>Welcome, {user.name}</span>
              <button onClick={handleLogout}>Logout</button>
            </div>
          ) : (
            <div className="auth-buttons">
              <button onClick={() => router.push('/auth/login')}>Login</button>
              <button onClick={() => router.push('/auth/register')}>Register</button>
            </div>
          )}
        </nav>
      </header>
      <main>{children}</main>
      <style jsx>{`
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          background: #fff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .logo {
          font-size: 1.5rem;
          font-weight: bold;
          color: #0070f3;
        }
        .auth-buttons button {
          margin-left: 1rem;
          padding: 0.5rem 1rem;
          border: 1px solid #0070f3;
          background: white;
          color: #0070f3;
          border-radius: 5px;
          cursor: pointer;
        }
        .user-menu {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
      `}</style>
    </div>
  );
}