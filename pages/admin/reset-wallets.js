// pages/admin/reset-wallets.js
import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function ResetWallets() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const resetAllWallets = async () => {
    setLoading(true);
    setMessage('');

    try {
      // Get all users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('user_id');

      if (usersError) throw usersError;

      // Reset each wallet
      for (const user of users) {
        const { error: walletError } = await supabase
          .from('wallets')
          .upsert({
            user_id: user.user_id,
            balance: 0,
            trial_bonus: user.user_id === '000001' ? 0 : 10000, // No trial for admin
            pending_amount: 0,
            today_points: 0,
            total_earnings: 0,
            total_withdrawn: 0,
            last_reset_date: new Date().toISOString().split('T')[0]
          }, {
            onConflict: 'user_id'
          });

        if (walletError) throw walletError;
      }

      setMessage(`✅ Successfully reset wallets for ${users.length} users`);

    } catch (error) {
      console.error('Error resetting wallets:', error);
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Reset User Wallets</h1>
      <p>This will reset all user wallets to default values.</p>
      
      <button 
        onClick={resetAllWallets}
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
        {loading ? 'Resetting...' : 'Reset All Wallets'}
      </button>
      
      {message && (
        <div style={{
          padding: '12px',
          backgroundColor: message.includes('✅') ? '#dcfce7' : '#fef2f2',
          border: `1px solid ${message.includes('✅') ? '#bbf7d0' : '#fecaca'}`,
          borderRadius: '6px',
          color: message.includes('✅') ? '#166534' : '#dc2626'
        }}>
          {message}
        </div>
      )}
    </div>
  );
}