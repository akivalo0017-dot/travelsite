// pages/admin/test-db.js
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function TestDB() {
  const [status, setStatus] = useState('Testing...');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      setStatus('Connecting to Supabase...');
      
      // Test users table
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .limit(5);

      if (error) {
        setStatus(`Error: ${error.message}`);
        return;
      }

      setUsers(data || []);
      setStatus(`✅ Connected! Found ${data?.length} users`);
      
    } catch (error) {
      setStatus(`❌ Connection failed: ${error.message}`);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Database Connection Test</h1>
      <div className={`p-4 rounded-lg mb-4 ${
        status.includes('✅') ? 'bg-green-100 text-green-800' : 
        status.includes('❌') ? 'bg-red-100 text-red-800' : 
        'bg-yellow-100 text-yellow-800'
      }`}>
        {status}
      </div>
      
      {users.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Users in Database:</h2>
          <div className="space-y-2">
            {users.map(user => (
              <div key={user.id} className="p-3 border rounded">
                <p>ID: {user.user_id}</p>
                <p>Name: {user.name}</p>
                <p>Phone: {user.phone}</p>
                <p>Status: {user.status}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}