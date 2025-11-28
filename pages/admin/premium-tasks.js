// pages/admin/premium-tasks.js
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';

// Admin Layout Component (keep your existing one)
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

// Create Premium Task Modal (keep your existing one)
function CreatePremiumTaskModal({ isOpen, onClose, onCreate }) {
  const [formData, setFormData] = useState({
    set_number: 1,
    task_number: 1,
    penalty_amount: 5000,
    additional_pending: 2000,
    reward_amount: 0,
    completion_time_limit: 24,
    max_attempts: 3,
    task_type: 'commission',
    difficulty: 'medium',
    description: 'Gold Suit X5 Commission',
    instructions: 'Complete the commission task as per guidelines',
    requirements: 'Must have completed previous tasks'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('premium_config')
        .insert([{
          set_number: parseInt(formData.set_number),
          task_number: parseInt(formData.task_number),
          penalty_amount: parseFloat(formData.penalty_amount),
          additional_pending: parseFloat(formData.additional_pending),
          reward_amount: parseFloat(formData.reward_amount),
          completion_time_limit: parseInt(formData.completion_time_limit),
          max_attempts: parseInt(formData.max_attempts),
          task_type: formData.task_type,
          difficulty: formData.difficulty,
          description: formData.description,
          instructions: formData.instructions,
          requirements: formData.requirements,
          is_active: true,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;
      
      alert('Premium task created successfully!');
      onCreate();
      onClose();
      setFormData({
        set_number: 1,
        task_number: 1,
        penalty_amount: 5000,
        additional_pending: 2000,
        reward_amount: 0,
        completion_time_limit: 24,
        max_attempts: 3,
        task_type: 'commission',
        difficulty: 'medium',
        description: 'Gold Suit X5 Commission',
        instructions: 'Complete the commission task as per guidelines',
        requirements: 'Must have completed previous tasks'
      });
    } catch (error) {
      console.error('Error creating premium task:', error);
      alert('Error creating premium task: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b', margin: 0 }}>
            Create Premium Task
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              color: '#64748b',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Set Number
                </label>
                <select
                  value={formData.set_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, set_number: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  required
                >
                  {[1, 2, 3, 4, 5].map(num => (
                    <option key={num} value={num}>Set {num}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Task Number
                </label>
                <select
                  value={formData.task_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, task_number: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  required
                >
                  {Array.from({ length: 50 }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>Task {num}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Rest of your existing create modal form */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Task Type
                </label>
                <select
                  value={formData.task_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, task_type: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="commission">Commission</option>
                  <option value="verification">Verification</option>
                  <option value="deposit">Deposit</option>
                  <option value="investment">Investment</option>
                  <option value="referral">Referral</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Difficulty
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Penalty Amount (₹)
                </label>
                <input
                  type="number"
                  value={formData.penalty_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, penalty_amount: e.target.value }))}
                  min="0"
                  step="100"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Pending Amount (₹)
                </label>
                <input
                  type="number"
                  value={formData.additional_pending}
                  onChange={(e) => setFormData(prev => ({ ...prev, additional_pending: e.target.value }))}
                  min="0"
                  step="100"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Reward Amount (₹)
                </label>
                <input
                  type="number"
                  value={formData.reward_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, reward_amount: e.target.value }))}
                  min="0"
                  step="100"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Time Limit (Hours)
                </label>
                <input
                  type="number"
                  value={formData.completion_time_limit}
                  onChange={(e) => setFormData(prev => ({ ...prev, completion_time_limit: e.target.value }))}
                  min="1"
                  max="168"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Max Attempts
                </label>
                <input
                  type="number"
                  value={formData.max_attempts}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_attempts: e.target.value }))}
                  min="1"
                  max="10"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter task description"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                Instructions
              </label>
              <textarea
                value={formData.instructions}
                onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                placeholder="Detailed instructions for the task"
                rows="3"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                Requirements
              </label>
              <textarea
                value={formData.requirements}
                onChange={(e) => setFormData(prev => ({ ...prev, requirements: e.target.value }))}
                placeholder="Task requirements and prerequisites"
                rows="2"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  backgroundColor: loading ? '#9ca3af' : '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Creating...' : '⭐ Create Premium Task'}
              </button>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '12px 20px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// Assign Premium Task Modal - ENHANCED WITH SYNC FIXES
function AssignPremiumTaskModal({ isOpen, onClose, onAssign, premiumTasks, users }) {
  const [formData, setFormData] = useState({
    user_id: '',
    premium_task_id: '',
    priority: 'normal',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    if (formData.premium_task_id) {
      const task = premiumTasks.find(t => t.id === formData.premium_task_id);
      setSelectedTask(task);
    } else {
      setSelectedTask(null);
    }
  }, [formData.premium_task_id, premiumTasks]);

  useEffect(() => {
    if (formData.user_id) {
      const user = users.find(u => u.user_id === formData.user_id);
      setSelectedUser(user);
    } else {
      setSelectedUser(null);
    }
  }, [formData.user_id, users]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.user_id || !formData.premium_task_id) {
        throw new Error('Please select both user and premium task');
      }

      // Get the selected premium task details
      const selectedTask = premiumTasks.find(task => task.id === formData.premium_task_id);
      if (!selectedTask) {
        throw new Error('Selected premium task not found');
      }

      // Check if user already has this premium task
      const { data: existingAssignment } = await supabase
        .from('user_premium_tasks')
        .select('id')
        .eq('user_id', formData.user_id)
        .eq('premium_task_id', formData.premium_task_id)
        .in('status', ['assigned', 'in_progress'])
        .single();

      if (existingAssignment) {
        throw new Error('This user already has this premium task assigned');
      }

      // Get user's current progress to validate assignment
      const { data: userData } = await supabase
        .from('users')
        .select('current_set, current_task, name')
        .eq('user_id', formData.user_id)
        .single();

      if (!userData) {
        throw new Error('User data not found');
      }

      // Validate that the assigned task is not too far ahead of user's current position
      if (selectedTask.set_number > userData.current_set) {
        throw new Error(`Cannot assign Set ${selectedTask.set_number} task to user who is only on Set ${userData.current_set}`);
      }

      if (selectedTask.set_number === userData.current_set && selectedTask.task_number > userData.current_task + 2) {
        if (!confirm(`User is currently on Task ${userData.current_task}. Assigning Task ${selectedTask.task_number} which is far ahead. Continue?`)) {
          return;
        }
      }

      console.log('🎯 Assigning premium task:', {
        user: formData.user_id,
        task: selectedTask.id,
        position: `Set ${selectedTask.set_number} - Task ${selectedTask.task_number}`
      });

      // Get admin user info
      const adminUser = JSON.parse(localStorage.getItem('user'));

      // Create user premium task assignment with ALL required data
      const { data: assignment, error } = await supabase
        .from('user_premium_tasks')
        .insert([{
          user_id: formData.user_id,
          premium_task_id: formData.premium_task_id,
          set_number: selectedTask.set_number,
          task_number: selectedTask.task_number,
          penalty_amount: selectedTask.penalty_amount,
          additional_pending: selectedTask.additional_pending,
          reward_amount: selectedTask.reward_amount,
          completion_time_limit: selectedTask.completion_time_limit,
          max_attempts: selectedTask.max_attempts,
          task_type: selectedTask.task_type,
          difficulty: selectedTask.difficulty,
          description: selectedTask.description,
          instructions: selectedTask.instructions,
          requirements: selectedTask.requirements,
          priority: formData.priority,
          admin_notes: formData.notes,
          status: 'assigned',
          assigned_at: new Date().toISOString(),
          assigned_by: adminUser?.user_id // Track which admin assigned this
        }])
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Premium task assigned successfully:', assignment);

      // Send real-time notification to user
      await supabase
        .from('notifications')
        .insert([{
          user_id: formData.user_id,
          title: 'New Premium Task Assigned',
          message: `You have a new premium task: ${selectedTask.description} (Set ${selectedTask.set_number}, Task ${selectedTask.task_number})`,
          type: 'premium_task_assigned',
          related_id: assignment.id,
          read: false
        }]);

      alert('🎯 Premium task assigned successfully! User will see it when they reach the correct position.');
      
      onAssign(); // Refresh data
      onClose(); // Close modal
      
      // Reset form
      setFormData({
        user_id: '',
        premium_task_id: '',
        priority: 'normal',
        notes: ''
      });

    } catch (error) {
      console.error('❌ Error assigning premium task:', error);
      alert('Error assigning premium task: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '700px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b', margin: 0 }}>
            Assign Premium Task to User
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              color: '#64748b',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Select User
                </label>
                <select
                  value={formData.user_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, user_id: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  required
                >
                  <option value="">Choose a user...</option>
                  {users.filter(user => user.status === 'approved').map(user => (
                    <option key={user.user_id} value={user.user_id}>
                      {user.name} (Set {user.current_set || 1}, Task {user.current_task || 1})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                Select Premium Task
              </label>
              <select
                value={formData.premium_task_id}
                onChange={(e) => setFormData(prev => ({ ...prev, premium_task_id: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
                required
              >
                <option value="">Choose a premium task...</option>
                {premiumTasks.map(task => (
                  <option key={task.id} value={task.id}>
                    Set {task.set_number} - Task {task.task_number} ({task.task_type}) - ₹{task.penalty_amount} penalty
                  </option>
                ))}
              </select>
            </div>

            {/* User Progress Info */}
            {selectedUser && (
              <div style={{
                padding: '12px',
                backgroundColor: '#f0f9ff',
                borderRadius: '6px',
                border: '1px solid #e0f2fe'
              }}>
                <p style={{ fontSize: '13px', color: '#0369a1', margin: 0, fontWeight: '500' }}>
                  👤 {selectedUser.name} - Current Position: Set {selectedUser.current_set || 1}, Task {selectedUser.current_task || 1}
                </p>
              </div>
            )}

            {selectedTask && (
              <div style={{
                padding: '16px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', margin: '0 0 12px 0' }}>
                  Task Details
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Position:</span> 
                    <span style={{ color: '#1e293b', fontWeight: '500', marginLeft: '8px' }}>
                      Set {selectedTask.set_number} - Task {selectedTask.task_number}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Type:</span> 
                    <span style={{ color: '#1e293b', fontWeight: '500', marginLeft: '8px' }}>
                      {selectedTask.task_type}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Difficulty:</span> 
                    <span style={{ 
                      color: selectedTask.difficulty === 'easy' ? '#10b981' : 
                            selectedTask.difficulty === 'medium' ? '#f59e0b' :
                            selectedTask.difficulty === 'hard' ? '#ef4444' : '#7c3aed',
                      fontWeight: '500', 
                      marginLeft: '8px',
                      textTransform: 'capitalize'
                    }}>
                      {selectedTask.difficulty}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Penalty:</span> 
                    <span style={{ color: '#dc2626', fontWeight: '500', marginLeft: '8px' }}>
                      ₹{selectedTask.penalty_amount}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Reward:</span> 
                    <span style={{ color: '#10b981', fontWeight: '500', marginLeft: '8px' }}>
                      ₹{selectedTask.reward_amount || 0}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Time Limit:</span> 
                    <span style={{ color: '#1e293b', fontWeight: '500', marginLeft: '8px' }}>
                      {selectedTask.completion_time_limit}h
                    </span>
                  </div>
                </div>
                {selectedTask.instructions && (
                  <div style={{ marginTop: '12px' }}>
                    <span style={{ color: '#64748b', fontSize: '13px' }}>Instructions: </span>
                    <span style={{ color: '#1e293b', fontSize: '13px' }}>{selectedTask.instructions}</span>
                  </div>
                )}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                Admin Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any special instructions or notes for this assignment..."
                rows="3"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  backgroundColor: loading ? '#9ca3af' : '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Assigning...' : '🎯 Assign Premium Task'}
              </button>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '12px 20px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Premium Task Modal (keep your existing one)
function EditPremiumTaskModal({ isOpen, onClose, onUpdate, task }) {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData({
        set_number: task.set_number,
        task_number: task.task_number,
        penalty_amount: task.penalty_amount,
        additional_pending: task.additional_pending,
        reward_amount: task.reward_amount,
        completion_time_limit: task.completion_time_limit,
        max_attempts: task.max_attempts,
        task_type: task.task_type,
        difficulty: task.difficulty,
        description: task.description,
        instructions: task.instructions,
        requirements: task.requirements,
        is_active: task.is_active
      });
    }
  }, [task]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('premium_config')
        .update({
          set_number: parseInt(formData.set_number),
          task_number: parseInt(formData.task_number),
          penalty_amount: parseFloat(formData.penalty_amount),
          additional_pending: parseFloat(formData.additional_pending),
          reward_amount: parseFloat(formData.reward_amount),
          completion_time_limit: parseInt(formData.completion_time_limit),
          max_attempts: parseInt(formData.max_attempts),
          task_type: formData.task_type,
          difficulty: formData.difficulty,
          description: formData.description,
          instructions: formData.instructions,
          requirements: formData.requirements,
          is_active: formData.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id);

      if (error) throw error;
      
      alert('Premium task updated successfully!');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating premium task:', error);
      alert('Error updating premium task: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !task) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b', margin: 0 }}>
            Edit Premium Task
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              color: '#64748b',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            ×
          </button>
        </div>

        {/* Form - Similar to create modal but with current values */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Set Number
                </label>
                <select
                  value={formData.set_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, set_number: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  required
                >
                  {[1, 2, 3, 4, 5].map(num => (
                    <option key={num} value={num}>Set {num}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Task Number
                </label>
                <select
                  value={formData.task_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, task_number: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  required
                >
                  {Array.from({ length: 50 }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>Task {num}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Rest of your edit form (same structure as create modal) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Task Type
                </label>
                <select
                  value={formData.task_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, task_type: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="commission">Commission</option>
                  <option value="verification">Verification</option>
                  <option value="deposit">Deposit</option>
                  <option value="investment">Investment</option>
                  <option value="referral">Referral</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Difficulty
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Penalty Amount (₹)
                </label>
                <input
                  type="number"
                  value={formData.penalty_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, penalty_amount: e.target.value }))}
                  min="0"
                  step="100"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Pending Amount (₹)
                </label>
                <input
                  type="number"
                  value={formData.additional_pending}
                  onChange={(e) => setFormData(prev => ({ ...prev, additional_pending: e.target.value }))}
                  min="0"
                  step="100"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Reward Amount (₹)
                </label>
                <input
                  type="number"
                  value={formData.reward_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, reward_amount: e.target.value }))}
                  min="0"
                  step="100"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Time Limit (Hours)
                </label>
                <input
                  type="number"
                  value={formData.completion_time_limit}
                  onChange={(e) => setFormData(prev => ({ ...prev, completion_time_limit: e.target.value }))}
                  min="1"
                  max="168"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Max Attempts
                </label>
                <input
                  type="number"
                  value={formData.max_attempts}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_attempts: e.target.value }))}
                  min="1"
                  max="10"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                Instructions
              </label>
              <textarea
                value={formData.instructions}
                onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                rows="3"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                Requirements
              </label>
              <textarea
                value={formData.requirements}
                onChange={(e) => setFormData(prev => ({ ...prev, requirements: e.target.value }))}
                rows="2"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#374151' }}>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  style={{ width: '16px', height: '16px' }}
                />
                Active Task
              </label>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  backgroundColor: loading ? '#9ca3af' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Updating...' : '💾 Update Task'}
              </button>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '12px 20px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// Main Premium Tasks Component - ENHANCED WITH REAL-TIME SYNC
export default function AdminPremiumTasksPage() {
  const [premiumTasks, setPremiumTasks] = useState([]);
  const [userAssignments, setUserAssignments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('config');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filters, setFilters] = useState({
    set_number: '',
    task_type: '',
    difficulty: '',
    status: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
    setupRealtimeSubscriptions();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching premium tasks data...');

      // Fetch premium task configurations
      const { data: tasks, error: tasksError } = await supabase
        .from('premium_config')
        .select('*')
        .order('set_number', { ascending: true })
        .order('task_number', { ascending: true });

      if (tasksError) throw tasksError;

      // Fetch user assignments with related data
      const { data: assignments, error: assignmentsError } = await supabase
        .from('user_premium_tasks')
        .select(`
          *,
          users(name, user_id, current_set, current_task),
          premium_config(set_number, task_number, penalty_amount, reward_amount, task_type, difficulty)
        `)
        .order('assigned_at', { ascending: false });

      if (assignmentsError) throw assignmentsError;

      // Fetch users for assignment
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('user_id, name, current_set, current_task, status, total_earnings')
        .eq('status', 'approved')
        .order('name', { ascending: true });

      if (usersError) throw usersError;

      setPremiumTasks(tasks || []);
      setUserAssignments(assignments || []);
      setUsers(usersData || []);

      console.log('✅ Data fetched:', {
        premiumTasks: tasks?.length,
        assignments: assignments?.length,
        users: usersData?.length
      });

    } catch (error) {
      console.error('❌ Error fetching premium tasks data:', error);
      alert('Error loading data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    console.log('🔔 Setting up admin premium tasks real-time subscriptions');

    // Real-time subscription for premium config changes
    const configSubscription = supabase
      .channel('admin-premium-config')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'premium_config'
        },
        (payload) => {
          console.log('🔄 Premium config real-time update:', payload);
          fetchData(); // Refresh data
        }
      )
      .subscribe();

    // Real-time subscription for assignment updates
    const assignmentSubscription = supabase
      .channel('admin-premium-assignments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_premium_tasks'
        },
        (payload) => {
          console.log('🔄 Premium assignment real-time update:', payload);
          fetchData(); // Refresh admin data
        }
      )
      .subscribe();

    // Real-time subscription for user progress updates
    const userProgressSubscription = supabase
      .channel('admin-user-progress')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users'
        },
        (payload) => {
          console.log('📈 User progress update in admin:', payload);
          // If a user progresses, refresh assignments to show/hide tasks accordingly
          fetchData();
        }
      )
      .subscribe();

    return () => {
      configSubscription.unsubscribe();
      assignmentSubscription.unsubscribe();
      userProgressSubscription.unsubscribe();
    };
  };

  const handleToggleTask = async (taskId, isActive) => {
    try {
      const { error } = await supabase
        .from('premium_config')
        .update({ is_active: !isActive })
        .eq('id', taskId);

      if (error) throw error;
      
      fetchData();
    } catch (error) {
      console.error('Error toggling premium task:', error);
      alert('Error updating task: ' + error.message);
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowEditModal(true);
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this premium task configuration?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('premium_config')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      
      alert('Premium task deleted successfully!');
      fetchData();
    } catch (error) {
      console.error('Error deleting premium task:', error);
      alert('Error deleting task: ' + error.message);
    }
  };

  const handleCompleteAssignment = async (assignmentId) => {
    try {
      const assignment = userAssignments.find(a => a.id === assignmentId);
      if (!assignment) return;

      const { error } = await supabase
        .from('user_premium_tasks')
        .update({ 
          status: 'completed', 
          completed_at: new Date().toISOString() 
        })
        .eq('id', assignmentId);

      if (error) throw error;

      // If there's a reward, update user's balance
      if (assignment.reward_amount > 0) {
        const { error: balanceError } = await supabase
          .from('users')
          .update({
            total_earnings: (assignment.users.total_earnings || 0) + assignment.reward_amount
          })
          .eq('user_id', assignment.user_id);

        if (balanceError) throw balanceError;
      }
      
      alert('Assignment marked as completed!');
      fetchData();
    } catch (error) {
      console.error('Error completing assignment:', error);
      alert('Error completing assignment: ' + error.message);
    }
  };

  const handleCancelAssignment = async (assignmentId) => {
    if (!confirm('Are you sure you want to cancel this assignment?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('user_premium_tasks')
        .update({ 
          status: 'cancelled', 
          cancelled_at: new Date().toISOString() 
        })
        .eq('id', assignmentId);

      if (error) throw error;
      
      alert('Assignment cancelled!');
      fetchData();
    } catch (error) {
      console.error('Error cancelling assignment:', error);
      alert('Error cancelling assignment: ' + error.message);
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
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter functions
  const filteredTasks = premiumTasks.filter(task => {
    const matchesSet = !filters.set_number || task.set_number.toString() === filters.set_number;
    const matchesType = !filters.task_type || task.task_type === filters.task_type;
    const matchesDifficulty = !filters.difficulty || task.difficulty === filters.difficulty;
    const matchesSearch = !searchTerm || 
      task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.task_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSet && matchesType && matchesDifficulty && matchesSearch;
  });

  const filteredAssignments = userAssignments.filter(assignment => {
    const matchesStatus = !filters.status || assignment.status === filters.status;
    const matchesSearch = !searchTerm || 
      assignment.users?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return { bg: '#dcfce7', text: '#166534' };
      case 'assigned': return { bg: '#fef9c3', text: '#854d0e' };
      case 'in_progress': return { bg: '#dbeafe', text: '#1e40af' };
      case 'cancelled': return { bg: '#fecaca', text: '#dc2626' };
      case 'failed': return { bg: '#f3f4f6', text: '#6b7280' };
      default: return { bg: '#f3f4f6', text: '#6b7280' };
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'hard': return '#ef4444';
      case 'expert': return '#7c3aed';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <AdminLayout activeTab="premium">
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
            border: '3px solid #f59e0b',
            borderTop: '3px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#64748b', fontSize: '16px' }}>Loading premium tasks...</p>
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
    <AdminLayout activeTab="premium">
      <div style={{ padding: '30px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: '#1e293b',
                margin: '0 0 8px 0'
              }}>
                Premium Tasks Management
              </h1>
              <p style={{
                fontSize: '16px',
                color: '#64748b',
                margin: 0
              }}>
                Configure premium tasks and assign them to users with real-time sync.
              </p>
            </div>
            <button
              onClick={fetchData}
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
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
            <div style={{ fontSize: '24px', color: '#f59e0b', marginBottom: '8px' }}>⭐</div>
            <h3 style={{ fontSize: '14px', color: '#64748b', margin: '0 0 4px 0' }}>Total Tasks</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
              {premiumTasks.length}
            </p>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', color: '#8b5cf6', marginBottom: '8px' }}>🎯</div>
            <h3 style={{ fontSize: '14px', color: '#64748b', margin: '0 0 4px 0' }}>Active Assignments</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
              {userAssignments.filter(a => a.status === 'assigned').length}
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
            <h3 style={{ fontSize: '14px', color: '#64748b', margin: '0 0 4px 0' }}>Completed</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
              {userAssignments.filter(a => a.status === 'completed').length}
            </p>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', color: '#ef4444', marginBottom: '8px' }}>💰</div>
            <h3 style={{ fontSize: '14px', color: '#64748b', margin: '0 0 4px 0' }}>Total Penalty</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
              {formatCurrency(premiumTasks.reduce((sum, task) => sum + task.penalty_amount, 0))}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e2e8f0',
          marginBottom: '24px',
          backgroundColor: 'white',
          borderRadius: '8px 8px 0 0',
          padding: '0 4px'
        }}>
          {[
            { id: 'config', name: 'Task Configurations', icon: '⚙️' },
            { id: 'assignments', name: 'User Assignments', icon: '🎯' },
            { id: 'analytics', name: 'Analytics', icon: '📊' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 20px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #f59e0b' : '2px solid transparent',
                color: activeTab === tab.id ? '#f59e0b' : '#64748b',
                fontWeight: activeTab === tab.id ? '600' : '500',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </div>

        {/* Search and Filters */}
        <div style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <input
              type="text"
              placeholder="Search tasks or users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>

          {activeTab === 'config' && (
            <>
              <select
                value={filters.set_number}
                onChange={(e) => setFilters(prev => ({ ...prev, set_number: e.target.value }))}
                style={{
                  padding: '10px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  minWidth: '120px'
                }}
              >
                <option value="">All Sets</option>
                {[1, 2, 3, 4, 5].map(num => (
                  <option key={num} value={num.toString()}>Set {num}</option>
                ))}
              </select>

              <select
                value={filters.task_type}
                onChange={(e) => setFilters(prev => ({ ...prev, task_type: e.target.value }))}
                style={{
                  padding: '10px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  minWidth: '140px'
                }}
              >
                <option value="">All Types</option>
                <option value="commission">Commission</option>
                <option value="verification">Verification</option>
                <option value="deposit">Deposit</option>
                <option value="investment">Investment</option>
                <option value="referral">Referral</option>
                <option value="custom">Custom</option>
              </select>

              <select
                value={filters.difficulty}
                onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
                style={{
                  padding: '10px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  minWidth: '120px'
                }}
              >
                <option value="">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="expert">Expert</option>
              </select>
            </>
          )}

          {activeTab === 'assignments' && (
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              style={{
                padding: '10px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                minWidth: '140px'
              }}
            >
              <option value="">All Status</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="failed">Failed</option>
            </select>
          )}

          <button
            onClick={() => {
              setFilters({
                set_number: '',
                task_type: '',
                difficulty: '',
                status: ''
              });
              setSearchTerm('');
            }}
            style={{
              padding: '10px 16px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Clear Filters
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '12px 20px',
              backgroundColor: '#f59e0b',
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
            ⭐ Create New Task
          </button>
          <button
            onClick={() => setShowAssignModal(true)}
            style={{
              padding: '12px 20px',
              backgroundColor: '#8b5cf6',
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
            🎯 Assign to User
          </button>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'config' && (
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
                      Task Details
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
                      Type & Difficulty
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
                      Limits
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
                      Status & Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task, index) => (
                    <tr 
                      key={task.id} 
                      style={{ 
                        borderBottom: index < filteredTasks.length - 1 ? '1px solid #f1f5f9' : 'none',
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
                            Set {task.set_number} - Task {task.task_number}
                          </p>
                          <p style={{
                            fontSize: '13px',
                            color: '#64748b',
                            margin: '0 0 6px 0'
                          }}>
                            {task.description}
                          </p>
                          {task.instructions && (
                            <p style={{
                              fontSize: '12px',
                              color: '#94a3b8',
                              margin: 0,
                              fontStyle: 'italic'
                            }}>
                              {task.instructions.substring(0, 60)}...
                            </p>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '500',
                            backgroundColor: '#e0e7ff',
                            color: '#3730a3',
                            textTransform: 'capitalize'
                          }}>
                            {task.task_type}
                          </span>
                          <div style={{ marginTop: '8px' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '500',
                              backgroundColor: getDifficultyColor(task.difficulty) + '20',
                              color: getDifficultyColor(task.difficulty),
                              textTransform: 'capitalize'
                            }}>
                              {task.difficulty}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'grid', gap: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>Penalty:</span>
                            <span style={{ fontSize: '13px', fontWeight: '600', color: '#dc2626' }}>
                              {formatCurrency(task.penalty_amount)}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>Pending:</span>
                            <span style={{ fontSize: '13px', fontWeight: '500', color: '#f59e0b' }}>
                              {formatCurrency(task.additional_pending)}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>Reward:</span>
                            <span style={{ fontSize: '13px', fontWeight: '500', color: '#10b981' }}>
                              {formatCurrency(task.reward_amount)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'grid', gap: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>Time Limit:</span>
                            <span style={{ fontSize: '13px', fontWeight: '500', color: '#1e293b' }}>
                              {task.completion_time_limit}h
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>Attempts:</span>
                            <span style={{ fontSize: '13px', fontWeight: '500', color: '#1e293b' }}>
                              {task.max_attempts}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                          <span style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '500',
                            backgroundColor: task.is_active ? '#dcfce7' : '#fef2f2',
                            color: task.is_active ? '#166534' : '#dc2626'
                          }}>
                            {task.is_active ? '✅ Active' : '❌ Inactive'}
                          </span>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleEditTask(task)}
                              style={{
                                padding: '6px 10px',
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '11px',
                                cursor: 'pointer'
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleToggleTask(task.id, task.is_active)}
                              style={{
                                padding: '6px 10px',
                                backgroundColor: task.is_active ? '#ef4444' : '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '11px',
                                cursor: 'pointer'
                              }}
                            >
                              {task.is_active ? 'Disable' : 'Enable'}
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              style={{
                                padding: '6px 10px',
                                backgroundColor: '#6b7280',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '11px',
                                cursor: 'pointer'
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredTasks.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⭐</div>
                <p style={{ color: '#64748b', fontSize: '16px', margin: '0 0 8px 0' }}>
                  No premium tasks found
                </p>
                <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                  {premiumTasks.length === 0 
                    ? 'Create your first premium task to get started' 
                    : 'Try adjusting your filters or search terms'
                  }
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'assignments' && (
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
                      User & Assignment
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
                      Task Details
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
                      Timeline
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
                      Status & Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssignments.map((assignment, index) => (
                    <tr 
                      key={assignment.id} 
                      style={{ 
                        borderBottom: index < filteredAssignments.length - 1 ? '1px solid #f1f5f9' : 'none',
                        backgroundColor: index % 2 === 0 ? '#f8fafc' : 'white'
                      }}
                    >
                      <td style={{ padding: '16px 20px' }}>
                        <div>
                          <p style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#1e293b',
                            margin: '0 0 2px 0'
                          }}>
                            {assignment.users?.name}
                          </p>
                          <p style={{
                            fontSize: '12px',
                            color: '#64748b',
                            margin: '0 0 4px 0'
                          }}>
                            ID: {assignment.user_id} • Set {assignment.users?.current_set || 1}, Task {assignment.users?.current_task || 1}
                          </p>
                          {assignment.priority && assignment.priority !== 'normal' && (
                            <span style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: '500',
                              backgroundColor: 
                                assignment.priority === 'urgent' ? '#fef2f2' :
                                assignment.priority === 'high' ? '#fffbeb' : '#f0f9ff',
                              color: 
                                assignment.priority === 'urgent' ? '#dc2626' :
                                assignment.priority === 'high' ? '#d97706' : '#0369a1',
                              textTransform: 'uppercase'
                            }}>
                              {assignment.priority}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div>
                          <p style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#1e293b',
                            margin: '0 0 2px 0'
                          }}>
                            Set {assignment.set_number} - Task {assignment.task_number}
                          </p>
                          <p style={{
                            fontSize: '12px',
                            color: '#64748b',
                            margin: '0 0 4px 0'
                          }}>
                            {assignment.description}
                          </p>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: '500',
                              backgroundColor: '#e0e7ff',
                              color: '#3730a3',
                              textTransform: 'capitalize'
                            }}>
                              {assignment.task_type}
                            </span>
                            <span style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: '500',
                              backgroundColor: getDifficultyColor(assignment.difficulty) + '20',
                              color: getDifficultyColor(assignment.difficulty),
                              textTransform: 'capitalize'
                            }}>
                              {assignment.difficulty}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'grid', gap: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>Penalty:</span>
                            <span style={{ fontSize: '12px', fontWeight: '600', color: '#dc2626' }}>
                              {formatCurrency(assignment.penalty_amount)}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>Pending:</span>
                            <span style={{ fontSize: '12px', fontWeight: '500', color: '#f59e0b' }}>
                              {formatCurrency(assignment.additional_pending)}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>Reward:</span>
                            <span style={{ fontSize: '12px', fontWeight: '500', color: '#10b981' }}>
                              {formatCurrency(assignment.reward_amount)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'grid', gap: '4px' }}>
                          <div>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>Assigned:</span>
                            <p style={{ fontSize: '12px', color: '#1e293b', margin: '2px 0 0 0' }}>
                              {formatDate(assignment.assigned_at)}
                            </p>
                          </div>
                          {assignment.completed_at && (
                            <div>
                              <span style={{ fontSize: '11px', color: '#64748b' }}>Completed:</span>
                              <p style={{ fontSize: '12px', color: '#1e293b', margin: '2px 0 0 0' }}>
                                {formatDate(assignment.completed_at)}
                              </p>
                            </div>
                          )}
                          {assignment.completion_time_limit && (
                            <div>
                              <span style={{ fontSize: '11px', color: '#64748b' }}>Time Limit:</span>
                              <p style={{ fontSize: '12px', color: '#1e293b', margin: '2px 0 0 0' }}>
                                {assignment.completion_time_limit}h
                              </p>
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                          <span style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '500',
                            backgroundColor: getStatusColor(assignment.status).bg,
                            color: getStatusColor(assignment.status).text
                          }}>
                            {assignment.status === 'completed' && '✅ Completed'}
                            {assignment.status === 'assigned' && '🎯 Assigned'}
                            {assignment.status === 'in_progress' && '🔄 In Progress'}
                            {assignment.status === 'cancelled' && '❌ Cancelled'}
                            {assignment.status === 'failed' && '💀 Failed'}
                          </span>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            {assignment.status === 'assigned' && (
                              <>
                                <button
                                  onClick={() => handleCompleteAssignment(assignment.id)}
                                  style={{
                                    padding: '6px 10px',
                                    backgroundColor: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Complete
                                </button>
                                <button
                                  onClick={() => handleCancelAssignment(assignment.id)}
                                  style={{
                                    padding: '6px 10px',
                                    backgroundColor: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                            {assignment.status === 'in_progress' && (
                              <button
                                onClick={() => handleCompleteAssignment(assignment.id)}
                                style={{
                                  padding: '6px 10px',
                                  backgroundColor: '#10b981',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  cursor: 'pointer'
                                }}
                              >
                                Complete
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredAssignments.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
                <p style={{ color: '#64748b', fontSize: '16px', margin: '0 0 8px 0' }}>
                  No premium task assignments found
                </p>
                <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                  {userAssignments.length === 0 
                    ? 'Assign premium tasks to users to see them here' 
                    : 'Try adjusting your filters or search terms'
                  }
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '30px'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b', margin: '0 0 24px 0' }}>
              Premium Tasks Analytics
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              {/* Task Type Distribution */}
              <div style={{
                padding: '20px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: '0 0 16px 0' }}>
                  Task Type Distribution
                </h4>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {['commission', 'verification', 'deposit', 'investment', 'referral', 'custom'].map(type => {
                    const count = premiumTasks.filter(task => task.task_type === type).length;
                    const percentage = premiumTasks.length > 0 ? (count / premiumTasks.length * 100).toFixed(1) : 0;
                    return (
                      <div key={type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', color: '#64748b', textTransform: 'capitalize' }}>
                          {type}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ 
                            width: '100px', 
                            height: '8px', 
                            backgroundColor: '#e2e8f0',
                            borderRadius: '4px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${percentage}%`,
                              height: '100%',
                              backgroundColor: '#f59e0b',
                              borderRadius: '4px'
                            }} />
                          </div>
                          <span style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b', minWidth: '40px' }}>
                            {count} ({percentage}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Assignment Status */}
              <div style={{
                padding: '20px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: '0 0 16px 0' }}>
                  Assignment Status
                </h4>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {['assigned', 'in_progress', 'completed', 'cancelled', 'failed'].map(status => {
                    const count = userAssignments.filter(assignment => assignment.status === status).length;
                    const percentage = userAssignments.length > 0 ? (count / userAssignments.length * 100).toFixed(1) : 0;
                    const statusColors = {
                      assigned: '#f59e0b',
                      in_progress: '#3b82f6',
                      completed: '#10b981',
                      cancelled: '#ef4444',
                      failed: '#6b7280'
                    };
                    return (
                      <div key={status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ 
                          fontSize: '14px', 
                          color: '#64748b',
                          textTransform: 'capitalize'
                        }}>
                          {status.replace('_', ' ')}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ 
                            width: '100px', 
                            height: '8px', 
                            backgroundColor: '#e2e8f0',
                            borderRadius: '4px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${percentage}%`,
                              height: '100%',
                              backgroundColor: statusColors[status],
                              borderRadius: '4px'
                            }} />
                          </div>
                          <span style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b', minWidth: '40px' }}>
                            {count} ({percentage}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

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
          <strong> Total Tasks:</strong> {premiumTasks.length} • 
          <strong> Active Assignments:</strong> {userAssignments.filter(a => a.status === 'assigned').length} • 
          <strong> Last Updated:</strong> {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Modals */}
      <CreatePremiumTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={fetchData}
      />

      <AssignPremiumTaskModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onAssign={fetchData}
        premiumTasks={premiumTasks.filter(t => t.is_active)}
        users={users}
      />

      <EditPremiumTaskModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingTask(null);
        }}
        onUpdate={fetchData}
        task={editingTask}
      />
    </AdminLayout>
  );
}
