// pages/admin/users.js
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import AdminLayout from './AdminLayout';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState({});

  useEffect(() => {
    fetchUsersData();
    setupRealtimeSubscriptions();
  }, []);

  const fetchUsersData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching users data...');
      
      // Fetch basic user data
      const { data: usersData, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enhance each user with additional data
      const enhancedUsers = await Promise.all(
        (usersData || []).map(async (user) => {
          try {
            // Get wallet balance
            const { data: wallet } = await supabase
              .from('wallets')
              .select('balance')
              .eq('user_id', user.user_id)
              .single();

            // Get completed regular tasks count
            const { data: completedTasks } = await supabase
              .from('user_tasks')
              .select('id')
              .eq('user_id', user.user_id)
              .eq('status', 'completed');

            // Get active premium tasks count
            const { data: activePremiumTasks } = await supabase
              .from('user_premium_tasks')
              .select('id')
              .eq('user_id', user.user_id)
              .in('status', ['assigned', 'in_progress']);

            // Get total premium tasks count
            const { data: allPremiumTasks } = await supabase
              .from('user_premium_tasks')
              .select('id')
              .eq('user_id', user.user_id);

            return {
              ...user,
              wallet_balance: wallet?.balance || 0,
              completed_tasks: completedTasks?.length || 0,
              active_premium_tasks: activePremiumTasks?.length || 0,
              total_premium_tasks: allPremiumTasks?.length || 0,
              current_set: user.current_set || 1,
              current_task: user.current_task || 1
            };
          } catch (userError) {
            console.error(`Error enhancing user ${user.user_id}:`, userError);
            return {
              ...user,
              wallet_balance: 0,
              completed_tasks: 0,
              active_premium_tasks: 0,
              total_premium_tasks: 0,
              current_set: user.current_set || 1,
              current_task: user.current_task || 1
            };
          }
        })
      );

      console.log('✅ Enhanced users data:', enhancedUsers);
      setUsers(enhancedUsers);
      
      // Calculate stats
      const stats = {
        total: enhancedUsers.length,
        active: enhancedUsers.filter(u => u.status === 'approved').length,
        pending: enhancedUsers.filter(u => u.status === 'pending').length,
        total_earnings: enhancedUsers.reduce((sum, user) => sum + (user.total_earnings || 0), 0),
        total_wallet: enhancedUsers.reduce((sum, user) => sum + (user.wallet_balance || 0), 0)
      };
      setUserStats(stats);

    } catch (error) {
      console.error('❌ Error fetching users:', error);
      alert('Error loading users: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    console.log('🔔 Setting up real-time subscriptions...');

    // Real-time subscription for user updates
    const userSubscription = supabase
      .channel('admin-users-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users'
        },
        (payload) => {
          console.log('🔄 User real-time update:', payload);
          fetchUsersData(); // Refresh all data
        }
      )
      .subscribe((status) => {
        console.log('👥 Users subscription status:', status);
      });

    // Real-time subscription for wallet updates
    const walletSubscription = supabase
      .channel('admin-wallets-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallets'
        },
        (payload) => {
          console.log('💰 Wallet real-time update:', payload);
          // Update specific user's wallet balance
          setUsers(prev => prev.map(user => 
            user.user_id === payload.new.user_id 
              ? { ...user, wallet_balance: payload.new.balance }
              : user
          ));
        }
      )
      .subscribe((status) => {
        console.log('💳 Wallets subscription status:', status);
      });

    // Real-time subscription for task updates
    const taskSubscription = supabase
      .channel('admin-tasks-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_tasks'
        },
        (payload) => {
          console.log('📝 Task real-time update:', payload);
          fetchUsersData(); // Refresh to get updated counts
        }
      )
      .subscribe((status) => {
        console.log('✅ Tasks subscription status:', status);
      });

    // Real-time subscription for premium task updates
    const premiumTaskSubscription = supabase
      .channel('admin-premium-tasks-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_premium_tasks'
        },
        (payload) => {
          console.log('⭐ Premium task real-time update:', payload);
          fetchUsersData(); // Refresh to get updated counts
        }
      )
      .subscribe((status) => {
        console.log('🎯 Premium tasks subscription status:', status);
      });

    return () => {
      userSubscription.unsubscribe();
      walletSubscription.unsubscribe();
      taskSubscription.unsubscribe();
      premiumTaskSubscription.unsubscribe();
    };
  };

  const handleStatusUpdate = async (userId, newStatus) => {
    try {
      console.log(`Updating user ${userId} status to: ${newStatus}`);
      
      const { error } = await supabase
        .from('users')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      alert(`User ${newStatus} successfully!`);
      
      // Update local state immediately
      setUsers(prev => prev.map(user =>
        user.user_id === userId
          ? { ...user, status: newStatus }
          : user
      ));

    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Error updating user: ' + error.message);
    }
  };

  const handleRefresh = () => {
    console.log('🔄 Manual refresh triggered');
    fetchUsersData();
  };

  if (loading) {
    return (
      <AdminLayout activeTab="users">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '400px',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '3px solid #3b82f6',
            borderTop: '3px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: '#64748b', fontSize: '16px' }}>Loading users data...</p>
          <style jsx>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout activeTab="users">
      <div style={{ padding: '30px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 8px 0' }}>
                User Management
              </h1>
              <p style={{ fontSize: '16px', color: '#64748b', margin: 0 }}>
                Manage users, track progress, and monitor real-time activity.
              </p>
            </div>
            <button
              onClick={handleRefresh}
              style={{
                padding: '10px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px', 
          marginBottom: '24px' 
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '12px', 
            border: '1px solid #e2e8f0', 
            textAlign: 'center' 
          }}>
            <div style={{ fontSize: '24px', color: '#3b82f6', marginBottom: '8px' }}>👥</div>
            <h3 style={{ fontSize: '14px', color: '#64748b', margin: '0 0 4px 0' }}>Total Users</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
              {userStats.total}
            </p>
          </div>

          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '12px', 
            border: '1px solid #e2e8f0', 
            textAlign: 'center' 
          }}>
            <div style={{ fontSize: '24px', color: '#10b981', marginBottom: '8px' }}>✅</div>
            <h3 style={{ fontSize: '14px', color: '#64748b', margin: '0 0 4px 0' }}>Active Users</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
              {userStats.active}
            </p>
          </div>

          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '12px', 
            border: '1px solid #e2e8f0', 
            textAlign: 'center' 
          }}>
            <div style={{ fontSize: '24px', color: '#f59e0b', marginBottom: '8px' }}>💰</div>
            <h3 style={{ fontSize: '14px', color: '#64748b', margin: '0 0 4px 0' }}>Total Wallet</h3>
            <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981', margin: 0 }}>
              ₹{userStats.total_wallet?.toLocaleString() || 0}
            </p>
          </div>

          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '12px', 
            border: '1px solid #e2e8f0', 
            textAlign: 'center' 
          }}>
            <div style={{ fontSize: '24px', color: '#8b5cf6', marginBottom: '8px' }}>📊</div>
            <h3 style={{ fontSize: '14px', color: '#64748b', margin: '0 0 4px 0' }}>Total Earnings</h3>
            <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#8b5cf6', margin: 0 }}>
              ₹{userStats.total_earnings?.toLocaleString() || 0}
            </p>
          </div>
        </div>

        {/* Users Table */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '12px', 
          border: '1px solid #e2e8f0', 
          overflow: 'hidden' 
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <th style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#374151',
                    textTransform: 'uppercase',
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    User Information
                  </th>
                  <th style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#374151',
                    textTransform: 'uppercase',
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    Progress
                  </th>
                  <th style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#374151',
                    textTransform: 'uppercase',
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    Financials
                  </th>
                  <th style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#374151',
                    textTransform: 'uppercase',
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    Tasks
                  </th>
                  <th style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#374151',
                    textTransform: 'uppercase',
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    Status
                  </th>
                  <th style={{
                    padding: '16px 20px',
                    textAlign: 'center',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#374151',
                    textTransform: 'uppercase',
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr 
                    key={user.user_id} 
                    style={{ 
                      borderBottom: index < users.length - 1 ? '1px solid #f1f5f9' : 'none',
                      backgroundColor: index % 2 === 0 ? '#f8fafc' : 'white'
                    }}
                  >
                    <td style={{ padding: '16px 20px' }}>
                      <div>
                        <p style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#1e293b',
                          margin: '0 0 4px 0'
                        }}>
                          {user.name}
                        </p>
                        <p style={{
                          fontSize: '12px',
                          color: '#64748b',
                          margin: '0 0 2px 0'
                        }}>
                          {user.email}
                        </p>
                        <p style={{
                          fontSize: '11px',
                          color: '#94a3b8',
                          margin: '4px 0 0 0'
                        }}>
                          ID: {user.user_id}
                        </p>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div>
                        <p style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#1e293b',
                          margin: '0 0 4px 0'
                        }}>
                          Set {user.current_set} • Task {user.current_task}
                        </p>
                        <p style={{
                          fontSize: '12px',
                          color: '#64748b',
                          margin: 0
                        }}>
                          Joined: {new Date(user.created_at).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <p style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#10b981',
                          margin: 0
                        }}>
                          ₹{user.wallet_balance}
                        </p>
                        <p style={{
                          fontSize: '12px',
                          color: '#8b5cf6',
                          margin: 0
                        }}>
                          Earned: ₹{user.total_earnings || 0}
                        </p>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '500',
                            backgroundColor: '#dbeafe',
                            color: '#1e40af'
                          }}>
                            {user.completed_tasks} Completed
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '500',
                            backgroundColor: '#fef3c7',
                            color: '#92400e'
                          }}>
                            {user.active_premium_tasks} Active Premium
                          </span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: user.status === 'approved' ? '#dcfce7' : 
                                       user.status === 'pending' ? '#fef9c3' : '#fecaca',
                        color: user.status === 'approved' ? '#166534' : 
                              user.status === 'pending' ? '#854d0e' : '#dc2626'
                      }}>
                        {user.status === 'approved' && '✅ Approved'}
                        {user.status === 'pending' && '⏳ Pending'}
                        {user.status === 'rejected' && '❌ Rejected'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        {user.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(user.user_id, 'approved')}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(user.user_id, 'rejected')}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {user.status === 'approved' && (
                          <button
                            onClick={() => handleStatusUpdate(user.user_id, 'rejected')}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#6b7280',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            Revoke
                          </button>
                        )}
                        {user.status === 'rejected' && (
                          <button
                            onClick={() => handleStatusUpdate(user.user_id, 'approved')}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            Re-activate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
              <p style={{ color: '#64748b', fontSize: '16px', margin: '0 0 8px 0' }}>
                No users found
              </p>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                Users will appear here once they register.
              </p>
            </div>
          )}
        </div>

        {/* Debug Info */}
        <div style={{
          marginTop: '20px',
          padding: '16px',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#64748b'
        }}>
          <strong>Real-time Status:</strong> Active • 
          <strong> Total Users:</strong> {userStats.total} • 
          <strong> Last Updated:</strong> {new Date().toLocaleTimeString()}
        </div>
      </div>
    </AdminLayout>
  );
}
