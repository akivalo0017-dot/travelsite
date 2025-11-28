// pages/admin/debug-wallets.js
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function DebugWallets() {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*, users(user_id, name, phone)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWallets(data || []);
    } catch (error) {
      console.error('Error fetching wallets:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading wallets...</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Debug Wallets</h1>
      <p>Total wallets: {wallets.length}</p>
      
      <table border="1" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr>
            <th style={{ padding: '8px' }}>Wallet ID</th>
            <th style={{ padding: '8px' }}>User ID</th>
            <th style={{ padding: '8px' }}>User Name</th>
            <th style={{ padding: '8px' }}>Phone</th>
            <th style={{ padding: '8px' }}>Balance</th>
            <th style={{ padding: '8px' }}>Trial Bonus</th>
            <th style={{ padding: '8px' }}>Pending</th>
            <th style={{ padding: '8px' }}>Today Points</th>
            <th style={{ padding: '8px' }}>Total Earnings</th>
          </tr>
        </thead>
        <tbody>
          {wallets.map((wallet) => (
            <tr key={wallet.id}>
              <td style={{ padding: '8px', fontSize: '12px' }}>{wallet.id}</td>
              <td style={{ padding: '8px' }}>{wallet.user_id}</td>
              <td style={{ padding: '8px' }}>{wallet.users?.name}</td>
              <td style={{ padding: '8px' }}>{wallet.users?.phone}</td>
              <td style={{ padding: '8px' }}>₹{wallet.balance}</td>
              <td style={{ padding: '8px' }}>₹{wallet.trial_bonus}</td>
              <td style={{ padding: '8px' }}>₹{wallet.pending_amount}</td>
              <td style={{ padding: '8px' }}>₹{wallet.today_points}</td>
              <td style={{ padding: '8px' }}>₹{wallet.total_earnings}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}