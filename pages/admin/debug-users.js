// pages/admin/debug-users.js
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function DebugUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading users...</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Debug Users</h1>
      <p>Total users: {users.length}</p>
      
      <table border="1" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr>
            <th style={{ padding: '8px' }}>User ID</th>
            <th style={{ padding: '8px' }}>Name</th>
            <th style={{ padding: '8px' }}>Phone</th>
            <th style={{ padding: '8px' }}>Password</th>
            <th style={{ padding: '8px' }}>Status</th>
            <th style={{ padding: '8px' }}>Created At</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td style={{ padding: '8px' }}>{user.user_id}</td>
              <td style={{ padding: '8px' }}>{user.name}</td>
              <td style={{ padding: '8px' }}>{user.phone}</td>
              <td style={{ padding: '8px', fontFamily: 'monospace', fontSize: '12px' }}>
                {user.password}
              </td>
              <td style={{ padding: '8px' }}>{user.status}</td>
              <td style={{ padding: '8px', fontSize: '12px' }}>
                {new Date(user.created_at).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}