// pages/admin/dashboard.js
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';

// Admin Layout Component
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
    { name: 'Withdrawals', href: '/admin/withdrawals', icon: '💸', id: 'withdrawals' },
    { name: 'Financial Control', href: '/admin/financial', icon: '💰', id: 'financial' },
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8fafc',
      display: 'flex'
    }}>
      {/* Sidebar */}
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
              onMouseOver={(e) => {
                if (activeTab !== item.id) {
                  e.target.style.backgroundColor = '#334155';
                  e.target.style.color = 'white';
                }
              }}
              onMouseOut={(e) => {
                if (activeTab !== item.id) {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#cbd5e1';
                }
              }}
            >
              <span style={{ marginRight: '12px', fontSize: '18px' }}>{item.icon}</span>
              {item.name}
            </a>
          ))}
        </nav>

        {/* User Info */}
        <div style={{
          padding: '20px 16px',
          borderTop: '1px solid #334155'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              backgroundColor: '#3b82f6',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              fontWeight: '600',
              color: 'white'
            }}>
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: '14px',
                fontWeight: '500',
                color: 'white',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {user?.name || 'Admin'}
              </p>
              <p style={{
                fontSize: '12px',
                color: '#94a3b8',
                margin: 0
              }}>
                Administrator
              </p>
            </div>
            <button
              onClick={handleLogout}
              style={{
                padding: '8px',
                color: '#94a3b8',
                background: 'none',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '18px'
              }}
              onMouseOver={(e) => {
                e.target.style.color = 'white';
                e.target.style.backgroundColor = '#475569';
              }}
              onMouseOut={(e) => {
                e.target.style.color = '#94a3b8';
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              ⎋
            </button>
          </div>
        </div>
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

// Stat Card Component
function StatCard({ title, value, subtitle, icon, color, trend }) {
  const colorMap = {
    blue: { bg: '#3b82f6', text: '#ffffff' },
    green: { bg: '#10b981', text: '#ffffff' },
    orange: { bg: '#f59e0b', text: '#ffffff' },
    purple: { bg: '#8b5cf6', text: '#ffffff' },
    red: { bg: '#ef4444', text: '#ffffff' },
    indigo: { bg: '#6366f1', text: '#ffffff' }
  };

  const colors = colorMap[color] || colorMap.blue;

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      padding: '24px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      transition: 'all 0.2s ease',
      cursor: 'pointer'
    }}
    onMouseOver={(e) => {
      e.target.style.transform = 'translateY(-2px)';
      e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    }}
    onMouseOut={(e) => {
      e.target.style.transform = 'translateY(0)';
      e.target.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between'
      }}>
        <div style={{ flex: 1 }}>
          <p style={{
            fontSize: '14px',
            fontWeight: '500',
            color: '#64748b',
            margin: '0 0 8px 0'
          }}>
            {title}
          </p>
          <p style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#1e293b',
            margin: '0 0 4px 0'
          }}>
            {value}
          </p>
          {subtitle && (
            <p style={{
              fontSize: '13px',
              color: '#64748b',
              margin: 0
            }}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              marginTop: '8px',
              padding: '4px 8px',
              borderRadius: '6px',
              backgroundColor: trend > 0 ? '#dcfce7' : '#fef2f2',
              color: trend > 0 ? '#166534' : '#dc2626',
              fontSize: '12px',
              fontWeight: '500'
            }}>
              {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}% from last week
            </div>
          )}
        </div>
        <div style={{
          padding: '14px',
          borderRadius: '10px',
          backgroundColor: colors.bg,
          color: colors.text,
          fontSize: '22px'
        }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// Quick Action Component
function QuickAction({ title, description, icon, color, onClick }) {
  const colorMap = {
    blue: { bg: '#dbeafe', text: '#1e40af', hover: '#bfdbfe' },
    green: { bg: '#dcfce7', text: '#166534', hover: '#bbf7d0' },
    orange: { bg: '#fed7aa', text: '#9a3412', hover: '#fdba74' },
    purple: { bg: '#e9d5ff', text: '#7e22ce', hover: '#d8b4fe' }
  };

  const colors = colorMap[color] || colorMap.blue;

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: '20px',
        backgroundColor: colors.bg,
        border: 'none',
        borderRadius: '10px',
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
      onMouseOver={(e) => {
        e.target.style.backgroundColor = colors.hover;
        e.target.style.transform = 'translateY(-2px)';
      }}
      onMouseOut={(e) => {
        e.target.style.backgroundColor = colors.bg;
        e.target.style.transform = 'translateY(0)';
      }}
    >
      <div style={{ fontSize: '24px', marginBottom: '8px' }}>{icon}</div>
      <p style={{
        fontSize: '16px',
        fontWeight: '600',
        color: colors.text,
        margin: '0 0 4px 0'
      }}>
        {title}
      </p>
      <p style={{
        fontSize: '13px',
        color: colors.text,
        opacity: 0.8,
        margin: 0
      }}>
        {description}
      </p>
    </button>
  );
}

// Main Dashboard Component
export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingUsers: 0,
    activeUsers: 0,
    totalEarnings: 0,
    pendingWithdrawals: 0,
    totalTasks: 0,
    todayEarnings: 0,
    systemBalance: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch users data
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('user_id, status, created_at');

      if (!usersError) {
        const totalUsers = users?.length || 0;
        const pendingUsers = users?.filter(user => user.status === 'pending').length || 0;
        const activeUsers = users?.filter(user => user.status === 'approved').length || 0;

        setStats(prev => ({
          ...prev,
          totalUsers,
          pendingUsers,
          activeUsers
        }));
      }

      // Fetch wallets for financial data
      const { data: wallets, error: walletsError } = await supabase
        .from('wallets')
        .select('balance, total_earnings, today_points');

      if (!walletsError && wallets) {
        const totalEarnings = wallets.reduce((sum, wallet) => sum + (wallet.total_earnings || 0), 0);
        const systemBalance = wallets.reduce((sum, wallet) => sum + (wallet.balance || 0), 0);
        const todayEarnings = wallets.reduce((sum, wallet) => sum + (wallet.today_points || 0), 0);

        setStats(prev => ({
          ...prev,
          totalEarnings,
          systemBalance,
          todayEarnings
        }));
      }

      // Fetch withdrawals
      const { data: withdrawals, error: withdrawalsError } = await supabase
        .from('withdrawals')
        .select('id')
        .eq('status', 'pending');

      if (!withdrawalsError) {
        setStats(prev => ({
          ...prev,
          pendingWithdrawals: withdrawals?.length || 0
        }));
      }

      // Fetch tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('user_tasks')
        .select('id')
        .eq('completed', true);

      if (!tasksError) {
        setStats(prev => ({
          ...prev,
          totalTasks: tasks?.length || 0
        }));
      }

      // Fetch recent activity
      const { data: activity, error: activityError } = await supabase
        .from('users')
        .select('user_id, name, status, created_at')
        .order('created_at', { ascending: false })
        .limit(6);

      if (!activityError) {
        setRecentActivity(activity || []);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'approve_users':
        router.push('/admin/users?filter=pending');
        break;
      case 'premium_tasks':
        router.push('/admin/premium-tasks');
        break;
      case 'withdrawals':
        router.push('/admin/withdrawals');
        break;
      case 'financial':
        router.push('/admin/financial');
        break;
    }
  };

  if (loading) {
    return (
      <AdminLayout activeTab="dashboard">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '3px solid #3b82f6',
              borderTop: '3px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }}></div>
            <p style={{ color: '#64748b', fontSize: '16px' }}>Loading dashboard...</p>
          </div>
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
    <AdminLayout activeTab="dashboard">
      <div style={{ padding: '30px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#1e293b',
            margin: '0 0 8px 0'
          }}>
            Admin Dashboard
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#64748b',
            margin: 0
          }}>
            Welcome back! Here's your business overview and quick actions.
          </p>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            subtitle="Registered accounts"
            icon="👥"
            color="blue"
            trend={12}
          />
          <StatCard
            title="Pending Approval"
            value={stats.pendingUsers}
            subtitle="Need review"
            icon="⏳"
            color="orange"
          />
          <StatCard
            title="Active Users"
            value={stats.activeUsers}
            subtitle="Currently approved"
            icon="✅"
            color="green"
            trend={8}
          />
          <StatCard
            title="System Balance"
            value={formatCurrency(stats.systemBalance)}
            subtitle="Total user balances"
            icon="💰"
            color="purple"
          />
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          <StatCard
            title="Total Earnings"
            value={formatCurrency(stats.totalEarnings)}
            subtitle="All time earnings"
            icon="📈"
            color="green"
            trend={15}
          />
          <StatCard
            title="Today's Earnings"
            value={formatCurrency(stats.todayEarnings)}
            subtitle="Earned today"
            icon="🕒"
            color="indigo"
          />
          <StatCard
            title="Pending Withdrawals"
            value={stats.pendingWithdrawals}
            subtitle="Awaiting approval"
            icon="💸"
            color="red"
          />
          <StatCard
            title="Tasks Completed"
            value={stats.totalTasks}
            subtitle="All time tasks"
            icon="✅"
            color="blue"
            trend={25}
          />
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '32px',
          marginBottom: '32px'
        }}>
          {/* Quick Actions */}
          <div>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#1e293b',
              margin: '0 0 20px 0'
            }}>
              Quick Actions
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px'
            }}>
              <QuickAction
                title="Approve Users"
                description="Review pending user registrations"
                icon="👥"
                color="blue"
                onClick={() => handleQuickAction('approve_users')}
              />
              <QuickAction
                title="Premium Tasks"
                description="Configure premium task settings"
                icon="⭐"
                color="orange"
                onClick={() => handleQuickAction('premium_tasks')}
              />
              <QuickAction
                title="Withdrawals"
                description="Process withdrawal requests"
                icon="💸"
                color="green"
                onClick={() => handleQuickAction('withdrawals')}
              />
              <QuickAction
                title="Financial Control"
                description="Manage user balances and deposits"
                icon="💰"
                color="purple"
                onClick={() => handleQuickAction('financial')}
              />
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#1e293b',
              margin: '0 0 20px 0'
            }}>
              Recent Activity
            </h2>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              overflow: 'hidden'
            }}>
              {recentActivity.length === 0 ? (
                <div style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: '#64748b'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                  <p>No recent activity</p>
                </div>
              ) : (
                <div style={{ padding: '0' }}>
                  {recentActivity.map((user, index) => (
                    <div
                      key={user.user_id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px 20px',
                        borderBottom: index < recentActivity.length - 1 ? '1px solid #f1f5f9' : 'none',
                        backgroundColor: index % 2 === 0 ? '#f8fafc' : 'white'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          backgroundColor: '#3b82f6',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: 'white'
                        }}>
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p style={{
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#1e293b',
                            margin: '0 0 2px 0'
                          }}>
                            {user.name}
                          </p>
                          <p style={{
                            fontSize: '12px',
                            color: '#64748b',
                            margin: 0
                          }}>
                            ID: {user.user_id}
                          </p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{
                          fontSize: '12px',
                          color: '#64748b',
                          margin: '0 0 4px 0'
                        }}>
                          {formatDate(user.created_at)}
                        </p>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '500',
                          backgroundColor: user.status === 'approved' ? '#dcfce7' : 
                                         user.status === 'pending' ? '#fef9c3' : '#fecaca',
                          color: user.status === 'approved' ? '#166534' : 
                                user.status === 'pending' ? '#854d0e' : '#dc2626'
                        }}>
                          {user.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* System Status */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '24px'
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#1e293b',
            margin: '0 0 16px 0'
          }}>
            System Status
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '12px',
                height: '12px',
                backgroundColor: '#10b981',
                borderRadius: '50%',
                margin: '0 auto 8px'
              }}></div>
              <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 4px 0' }}>Database</p>
              <p style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: 0 }}>Online</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '12px',
                height: '12px',
                backgroundColor: '#10b981',
                borderRadius: '50%',
                margin: '0 auto 8px'
              }}></div>
              <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 4px 0' }}>API</p>
              <p style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: 0 }}>Active</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '12px',
                height: '12px',
                backgroundColor: '#10b981',
                borderRadius: '50%',
                margin: '0 auto 8px'
              }}></div>
              <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 4px 0' }}>Payments</p>
              <p style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: 0 }}>Ready</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '12px',
                height: '12px',
                backgroundColor: '#10b981',
                borderRadius: '50%',
                margin: '0 auto 8px'
              }}></div>
              <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 4px 0' }}>Tasks</p>
              <p style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: 0 }}>Live</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}