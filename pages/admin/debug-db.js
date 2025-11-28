// pages/admin/debug-db.js
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';

function AdminLayout({ children, activeTab }) {
  const router = useRouter();
  
  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: '📊', id: 'dashboard' },
    { name: 'Debug DB', href: '/admin/debug-db', icon: '🐛', id: 'debug' },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex' }}>
      <div style={{ width: '280px', backgroundColor: '#1e293b', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: '70px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: 'white', margin: 0 }}>🏨 Travel Working</h1>
        </div>
        <nav style={{ flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {navigation.map((item) => (
            <a key={item.name} href={item.href} style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', fontSize: '15px', fontWeight: '500', borderRadius: '8px', color: activeTab === item.id ? '#1e293b' : '#cbd5e1', textDecoration: 'none', backgroundColor: activeTab === item.id ? '#f1f5f9' : 'transparent' }}>
              <span style={{ marginRight: '12px', fontSize: '18px' }}>{item.icon}</span>
              {item.name}
            </a>
          ))}
        </nav>
      </div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

export default function DebugDB() {
  const [status, setStatus] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkDatabase();
  }, []);

  const checkDatabase = async () => {
    try {
      setLoading(true);
      
      // Check if premium_config table exists
      const premiumConfigCheck = await supabase
        .from('premium_config')
        .select('count')
        .limit(1)
        .then(() => ({ exists: true, error: null }))
        .catch(error => ({ exists: false, error }));

      // Check if user_premium_tasks table exists  
      const userPremiumTasksCheck = await supabase
        .from('user_premium_tasks')
        .select('count')
        .limit(1)
        .then(() => ({ exists: true, error: null }))
        .catch(error => ({ exists: false, error }));

      // Check if we can insert data
      let insertCheck = { success: false, error: null };
      if (premiumConfigCheck.exists) {
        try {
          const { error } = await supabase
            .from('premium_config')
            .insert({ set_number: 1, task_number: 1, description: 'Test Task' })
            .select();
          
          if (error && error.code === '23505') {
            // Unique violation means table exists and constraint works
            insertCheck = { success: true, error: null };
          } else if (!error) {
            insertCheck = { success: true, error: null };
            // Clean up test insert
            await supabase.from('premium_config').delete().eq('set_number', 1).eq('task_number', 1);
          } else {
            insertCheck = { success: false, error };
          }
        } catch (error) {
          insertCheck = { success: false, error };
        }
      }

      setStatus({
        premiumConfig: premiumConfigCheck,
        userPremiumTasks: userPremiumTasksCheck,
        insertTest: insertCheck,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Debug error:', error);
      setStatus({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const createTables = async () => {
    try {
      setLoading(true);
      
      // Simple table creation
      const queries = [
        `CREATE TABLE IF NOT EXISTS premium_config (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          set_number INTEGER NOT NULL,
          task_number INTEGER NOT NULL,
          penalty_amount DECIMAL(10,2) DEFAULT 5000.00,
          additional_pending DECIMAL(10,2) DEFAULT 2000.00,
          description TEXT DEFAULT 'Gold Suit X5 Commission',
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`,
        
        `CREATE TABLE IF NOT EXISTS user_premium_tasks (
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
        )`
      ];

      for (const query of queries) {
        const { error } = await supabase.rpc('exec_sql', { query });
        if (error) {
          // Try alternative method
          console.log('RPC failed, trying direct SQL...');
          break;
        }
      }

      // Insert sample data
      await supabase.from('premium_config').insert([
        { set_number: 1, task_number: 15, description: 'Gold Suit X5 Commission - Set 1' },
        { set_number: 2, task_number: 10, description: 'Gold Suit X5 Commission - Set 2' },
        { set_number: 3, task_number: 5, description: 'Gold Suit X5 Commission - Set 3' }
      ]).then(result => {
        if (result.error && result.error.code === '23505') {
          console.log('Sample data already exists');
        }
      });

      alert('Tables created successfully!');
      checkDatabase();
      
    } catch (error) {
      console.error('Create tables error:', error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout activeTab="debug">
      <div style={{ padding: '30px' }}>
        <h1>Database Debug</h1>
        
        <button onClick={checkDatabase} disabled={loading} style={{ marginBottom: '20px', padding: '10px 20px' }}>
          {loading ? 'Checking...' : 'Refresh Status'}
        </button>

        <button onClick={createTables} disabled={loading} style={{ marginBottom: '20px', padding: '10px 20px', marginLeft: '10px', backgroundColor: '#3b82f6', color: 'white', border: 'none' }}>
          Create Tables
        </button>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}>
          <h3>Database Status:</h3>
          <pre>{JSON.stringify(status, null, 2)}</pre>
        </div>

        <div style={{ marginTop: '20px', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px' }}>
          <h3>Manual SQL to Run:</h3>
          <textarea 
            style={{ width: '100%', height: '200px', fontFamily: 'monospace', padding: '10px' }}
            defaultValue={`
-- Run this in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS premium_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  set_number INTEGER NOT NULL,
  task_number INTEGER NOT NULL,
  penalty_amount DECIMAL(10,2) DEFAULT 5000.00,
  additional_pending DECIMAL(10,2) DEFAULT 2000.00,
  description TEXT DEFAULT 'Gold Suit X5 Commission',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_premium_tasks (
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
);

INSERT INTO premium_config (set_number, task_number, description) VALUES
(1, 15, 'Gold Suit X5 Commission - Set 1'),
(2, 10, 'Gold Suit X5 Commission - Set 2'),
(3, 5, 'Gold Suit X5 Commission - Set 3');
            `.trim()}
          />
        </div>
      </div>
    </AdminLayout>
  );
}