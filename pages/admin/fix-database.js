// pages/admin/fix-database.js
import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function FixDatabase() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fixDatabase = async () => {
    setLoading(true);
    setMessage('');

    try {
      // Step 1: Delete all existing wallets
      const { error: deleteError } = await supabase
        .from('wallets')
        .delete()
        .neq('user_id', '000001'); // Keep admin wallet

      if (deleteError) throw deleteError;
      setMessage('✅ Step 1: Deleted old wallets');

      // Step 2: Get all users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('user_id, name');

      if (usersError) throw usersError;
      setMessage(prev => prev + '\n✅ Step 2: Found ' + users.length + ' users');

      // Step 3: Create unique wallets for each user
      const walletsToCreate = users.map(user => ({
        user_id: user.user_id,
        balance: 0,
        trial_bonus: user.user_id === '000001' ? 0 : 10000, // No trial for admin
        pending_amount: 0,
        today_points: 0,
        total_earnings: 0,
        total_withdrawn: 0,
        last_reset_date: new Date().toISOString().split('T')[0]
      }));

      const { error: walletsError } = await supabase
        .from('wallets')
        .insert(walletsToCreate);

      if (walletsError) throw walletsError;
      setMessage(prev => prev + '\n✅ Step 3: Created ' + walletsToCreate.length + ' unique wallets');

      setMessage(prev => prev + '\n🎉 Database fixed successfully!');

    } catch (error) {
      console.error('Error fixing database:', error);
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Fix Database</h1>
      <p>This will delete all wallets and create unique wallets for each user.</p>
      
      <button 
        onClick={fixDatabase}
        disabled={loading}
        style={{
          padding: '12px 24px',
          backgroundColor: loading ? '#9ca3af' : '#dc2626',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '16px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {loading ? 'Fixing Database...' : 'Fix Database'}
      </button>
      
      {message && (
        <div style={{
          padding: '12px',
          backgroundColor: '#f3f4f6',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          color: '#374151',
          whiteSpace: 'pre-line',
          fontFamily: 'monospace',
          fontSize: '12px'
        }}>
          {message}
        </div>
      )}
    </div>
  );
}