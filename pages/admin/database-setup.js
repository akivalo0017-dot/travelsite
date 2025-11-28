// pages/admin/database-setup.js
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';

// Reuse the AdminLayout from your dashboard
function AdminLayout({ children, activeTab }) {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/auth/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: '📊', id: 'dashboard' },
    { name: 'User Management', href: '/admin/users', icon: '👥', id: 'users' },
    { name: 'Premium Tasks', href: '/admin/premium-tasks', icon: '⭐', id: 'premium' },
    { name: 'Database Setup', href: '/admin/database-setup', icon: '🛠️', id: 'setup' },
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8fafc',
      display: 'flex'
    }}>
      {/* Sidebar - same as your dashboard */}
      <div style={{
        width: '280px',
        backgroundColor: '#1e293b',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Logo */}
        <div style={{
          height: '70px',
          borderBottom: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 20px'
        }}>
          <h1 style={{ 
            fontSize: '22px', 
            fontWeight: 'bold', 
            color: 'white',
            margin: 0
          }}>
            🏨 Travel Working
          </h1>
        </div>

        {/* Navigation */}
        <nav style={{ 
          flex: 1, 
          padding: '20px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {navigation.map((item) => (
            <a
              key={item.name}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '14px 16px',
                fontSize: '15px',
                fontWeight: '500',
                borderRadius: '8px',
                color: activeTab === item.id ? '#1e293b' : '#cbd5e1',
                textDecoration: 'none',
                backgroundColor: activeTab === item.id ? '#f1f5f9' : 'transparent',
                transition: 'all 0.2s ease'
              }}
            >
              <span style={{ marginRight: '12px', fontSize: '18px' }}>{item.icon}</span>
              {item.name}
            </a>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1 }}>
        <main style={{ minHeight: '100vh' }}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DatabaseSetup() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [tablesExist, setTablesExist] = useState(null);

  const checkTables = async () => {
    try {
      // Check if premium_config table exists
      const { data, error } = await supabase
        .from('premium_config')
        .select('id')
        .limit(1);

      if (error && error.code === '42P01') {
        setTablesExist(false);
      } else {
        setTablesExist(true);
      }
    } catch (error) {
      setTablesExist(false);
    }
  };

  // Check tables on component mount
  useState(() => {
    checkTables();
  }, []);

  const setupDatabase = async () => {
    setLoading(true);
    setMessage('');
    setError('');

    try {
      // Create premium_config table
      const { error: createTable1Error } = await supabase
        .from('premium_config')
        .select('id')
        .limit(1)
        .then(() => ({ error: null }))
        .catch(async (error) => {
          if (error.code === '42P01') {
            // Table doesn't exist, create it
            const { error: createError } = await supabase.rpc('exec_sql', {
              query: `
                CREATE TABLE premium_config (
                  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                  set_number INTEGER NOT NULL,
                  task_number INTEGER NOT NULL,
                  penalty_amount DECIMAL(10,2) DEFAULT 5000.00,
                  additional_pending DECIMAL(10,2) DEFAULT 2000.00,
                  description TEXT DEFAULT 'Gold Suit X5 Commission',
                  is_active BOOLEAN DEFAULT true,
                  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
              `
            });
            return { error: createError };
          }
          return { error };
        });

      if (createTable1Error) throw createTable1Error;
      setMessage('✓ premium_config table created');

      // Create user_premium_tasks table
      const { error: createTable2Error } = await supabase
        .from('user_premium_tasks')
        .select('id')
        .limit(1)
        .then(() => ({ error: null }))
        .catch(async (error) => {
          if (error.code === '42P01') {
            const { error: createError } = await supabase.rpc('exec_sql', {
              query: `
                CREATE TABLE user_premium_tasks (
                  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                  user_id VARCHAR NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                  premium_task_id UUID REFERENCES premium_config(id),
                  set_number INTEGER NOT NULL,
                  task_number INTEGER NOT NULL,
                  penalty_amount DECIMAL(10,2) NOT NULL,
                  additional_pending DECIMAL(10,2) NOT NULL,
                  scheduled_for DATE NOT NULL,
                  status VARCHAR DEFAULT 'scheduled',
                  completed_at TIMESTAMP WITH TIME ZONE,
                  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
              `
            });
            return { error: createError };
          }
          return { error };
        });

      if (createTable2Error) throw createTable2Error;
      setMessage(prev => prev + '\n✓ user_premium_tasks table created');

      // Insert sample data
      const { error: insertError } = await supabase
        .from('premium_config')
        .insert([
          { set_number: 1, task_number: 15, description: 'Gold Suit X5 Commission - Set 1' },
          { set_number: 2, task_number: 10, description: 'Gold Suit X5 Commission - Set 2' },
          { set_number: 3, task_number: 5, description: 'Gold Suit X5 Commission - Set 3' }
        ]);

      if (insertError && insertError.code !== '23505') {
        console.log('Insert error (may be duplicate):', insertError);
      }
      setMessage(prev => prev + '\n✓ Sample data inserted');

      // Create unique index
      const { error: indexError } = await supabase.rpc('exec_sql', {
        query: `
          CREATE UNIQUE INDEX IF NOT EXISTS unique_active_set_task 
          ON premium_config (set_number, task_number) 
          WHERE is_active = true
        `
      });

      if (!indexError) {
        setMessage(prev => prev + '\n✓ Unique index created');
      }

      setMessage(prev => prev + '\n\n🎉 Database setup completed successfully!');
      setTablesExist(true);
      
    } catch (error) {
      console.error('Database setup error:', error);
      setError(`Setup failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout activeTab="setup">
      <div style={{ padding: '30px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '20px' }}>
          Database Setup
        </h1>
        
        <div style={{ 
          backgroundColor: 'white', 
          padding: '24px', 
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          marginBottom: '20px'
        }}>
          <h3 style={{ marginBottom: '16px' }}>Current Status:</h3>
          {tablesExist === null && <p>Checking database...</p>}
          {tablesExist === true && (
            <p style={{ color: '#059669', fontWeight: 'bold' }}>
              ✅ Premium tasks tables already exist!
            </p>
          )}
          {tablesExist === false && (
            <p style={{ color: '#dc2626', fontWeight: 'bold' }}>
              ❌ Premium tasks tables not found. Run setup below.
            </p>
          )}
        </div>
        
        <div style={{ 
          backgroundColor: 'white', 
          padding: '24px', 
          borderRadius: '12px',
          border: '1px solid #e2e8f0'
        }}>
          <p style={{ marginBottom: '20px' }}>
            This will create the required tables for Premium Tasks functionality.
          </p>
          
          <button
            onClick={setupDatabase}
            disabled={loading}
            style={{
              padding: '12px 24px',
              backgroundColor: loading ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '20px'
            }}
          >
            {loading ? 'Setting up Database...' : 'Setup Database Tables'}
          </button>

          {message && (
            <div style={{ 
              marginTop: '20px', 
              padding: '16px',
              backgroundColor: '#f0f9ff',
              borderRadius: '6px',
              whiteSpace: 'pre-line',
              fontFamily: 'monospace',
              fontSize: '14px'
            }}>
              {message}
            </div>
          )}

          {error && (
            <div style={{ 
              marginTop: '20px', 
              padding: '16px',
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontSize: '14px'
            }}>
              Error: {error}
            </div>
          )}
        </div>

        <div style={{ 
          marginTop: '20px',
          padding: '16px',
          backgroundColor: '#fffbeb',
          borderRadius: '8px',
          fontSize: '14px'
        }}>
          <strong>Note:</strong> If the setup button doesn't work, please run the SQL script manually in your Supabase SQL Editor.
        </div>
      </div>
    </AdminLayout>
  );
}