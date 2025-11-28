// pages/user/tasks.js - COMPLETE FIXED VERSION
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';

export default function UserTasksPage() {
  const [user, setUser] = useState(null);
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSet, setCurrentSet] = useState(1);
  const [currentTask, setCurrentTask] = useState(1);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const userObj = JSON.parse(userData);
        setUser(userObj);
        fetchUserProgress(userObj.user_id);
      } catch (error) {
        console.error('Error parsing user data:', error);
        router.push('/auth/login');
      }
    } else {
      router.push('/auth/login');
    }
  }, []);

  const fetchUserProgress = async (userId) => {
    try {
      console.log('🔄 Fetching user progress for:', userId);
      
      // Get user's current progress
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('current_set, current_task, total_earnings')
        .eq('user_id', userId)
        .single();

      if (userError) throw userError;

      const userSet = userData.current_set || 1;
      const userTask = userData.current_task || 1;
      
      console.log(`📊 User progress: Set ${userSet}, Task ${userTask}`);
      
      setCurrentSet(userSet);
      setCurrentTask(userTask);
      await fetchCombinedTasks(userId, userSet, userTask);

    } catch (error) {
      console.error('❌ Error fetching user progress:', error);
      alert('Error loading tasks: ' + error.message);
    }
  };

  const fetchCombinedTasks = async (userId, currentSet, currentTask) => {
    try {
      setLoading(true);
      console.log(`🎯 Fetching tasks for Set ${currentSet}, up to Task ${currentTask}`);

      // Fetch regular tasks for current set
      const { data: regularTasks, error: regularError } = await supabase
        .from('user_tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('set_number', currentSet)
        .order('task_number', { ascending: true });

      if (regularError) throw regularError;

      // Fetch premium tasks ONLY for current position or before
      const { data: premiumTasks, error: premiumError } = await supabase
        .from('user_premium_tasks')
        .select(`
          *,
          premium_config (
            description,
            instructions,
            requirements,
            task_type,
            difficulty,
            reward_amount,
            penalty_amount,
            additional_pending
          )
        `)
        .eq('user_id', userId)
        .eq('set_number', currentSet)
        .lte('task_number', currentTask) // Only show premium tasks up to current task
        .in('status', ['assigned', 'in_progress', 'completed']);

      if (premiumError) throw premiumError;

      console.log('✅ Regular tasks:', regularTasks?.length);
      console.log('⭐ Premium tasks (within range):', premiumTasks?.length);

      // Combine tasks - premium tasks replace regular tasks at same position
      const combinedTasks = (regularTasks || []).map(regularTask => {
        // Check if there's a premium task at this position
        const premiumTask = premiumTasks?.find(pt => 
          pt.task_number === regularTask.task_number
        );

        if (premiumTask) {
          console.log(`🔄 Replacing task ${regularTask.task_number} with premium version`);
          return {
            ...regularTask,
            isPremium: true,
            premiumData: premiumTask,
            // Use premium task description and details
            description: premiumTask.premium_config?.description || premiumTask.description,
            instructions: premiumTask.premium_config?.instructions,
            requirements: premiumTask.premium_config?.requirements,
            reward_amount: premiumTask.premium_config?.reward_amount || premiumTask.reward_amount,
            penalty_amount: premiumTask.penalty_amount,
            additional_pending: premiumTask.additional_pending,
            status: premiumTask.status, // Use premium task status
            task_type: premiumTask.premium_config?.task_type,
            difficulty: premiumTask.premium_config?.difficulty
          };
        }

        return {
          ...regularTask,
          isPremium: false
        };
      });

      console.log('📦 Combined tasks:', combinedTasks);
      setAllTasks(combinedTasks);

    } catch (error) {
      console.error('❌ Error fetching combined tasks:', error);
      alert('Error loading tasks: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Real-time subscriptions
  useEffect(() => {
    if (!user?.user_id) return;

    console.log('🔔 Setting up real-time subscriptions for user:', user.user_id);

    // Subscription for user progress changes
    const progressSubscription = supabase
      .channel(`user-progress-${user.user_id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `user_id=eq.${user.user_id}`
        },
        (payload) => {
          console.log('📈 User progress real-time update:', payload.new);
          setCurrentSet(payload.new.current_set);
          setCurrentTask(payload.new.current_task);
          fetchCombinedTasks(user.user_id, payload.new.current_set, payload.new.current_task);
        }
      )
      .subscribe();

    // Subscription for premium task assignments
    const premiumTaskSubscription = supabase
      .channel(`user-premium-tasks-${user.user_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_premium_tasks',
          filter: `user_id=eq.${user.user_id}`
        },
        (payload) => {
          console.log('⭐ Premium task real-time update:', payload);
          fetchCombinedTasks(user.user_id, currentSet, currentTask);
        }
      )
      .subscribe();

    // Subscription for regular task updates
    const regularTaskSubscription = supabase
      .channel(`user-regular-tasks-${user.user_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_tasks',
          filter: `user_id=eq.${user.user_id}`
        },
        (payload) => {
          console.log('📝 Regular task real-time update:', payload);
          fetchCombinedTasks(user.user_id, currentSet, currentTask);
        }
      )
      .subscribe();

    return () => {
      progressSubscription.unsubscribe();
      premiumTaskSubscription.unsubscribe();
      regularTaskSubscription.unsubscribe();
    };
  }, [user?.user_id, currentSet, currentTask]);

  const handleStartTask = async (taskId, isPremium = false) => {
    try {
      console.log('🚀 Starting task:', taskId, 'Premium:', isPremium);
      
      if (isPremium) {
        const { error } = await supabase
          .from('user_premium_tasks')
          .update({
            status: 'in_progress',
            started_at: new Date().toISOString()
          })
          .eq('id', taskId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_tasks')
          .update({
            status: 'in_progress',
            started_at: new Date().toISOString()
          })
          .eq('id', taskId);

        if (error) throw error;
      }

      alert('Task started! Complete the requirements.');
      fetchCombinedTasks(user.user_id, currentSet, currentTask);
      
    } catch (error) {
      console.error('❌ Error starting task:', error);
      alert('Error starting task: ' + error.message);
    }
  };

  const handleCompleteTask = async (taskId, isPremium = false) => {
    if (!confirm('Have you completed all task requirements?')) return;

    try {
      console.log('✅ Completing task:', taskId, 'Premium:', isPremium);
      
      if (isPremium) {
        const { error } = await supabase
          .from('user_premium_tasks')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', taskId);

        if (error) throw error;
        
        // Add reward to user's wallet if applicable
        const task = allTasks.find(t => t.id === taskId);
        if (task && task.reward_amount > 0) {
          await addRewardToWallet(task.reward_amount);
        }
      } else {
        const { error } = await supabase
          .from('user_tasks')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', taskId);

        if (error) throw error;

        // Auto-progress to next task
        await progressToNextTask();
      }

      alert('Task completed successfully!');
      fetchCombinedTasks(user.user_id, currentSet, currentTask);
      
    } catch (error) {
      console.error('❌ Error completing task:', error);
      alert('Error completing task: ' + error.message);
    }
  };

  const progressToNextTask = async () => {
    try {
      const nextTask = currentTask + 1;
      
      // Check if there are more tasks in current set
      const { data: tasksInSet } = await supabase
        .from('user_tasks')
        .select('task_number')
        .eq('user_id', user.user_id)
        .eq('set_number', currentSet)
        .eq('status', 'assigned');

      if (tasksInSet && tasksInSet.length > 0) {
        // Move to next task in current set
        console.log(`➡️ Progressing to next task: ${nextTask}`);
        setCurrentTask(nextTask);
        await supabase
          .from('users')
          .update({ current_task: nextTask })
          .eq('user_id', user.user_id);
      } else {
        // Move to next set
        const nextSet = currentSet + 1;
        console.log(`🎉 Progressing to next set: ${nextSet}`);
        setCurrentSet(nextSet);
        setCurrentTask(1);
        await supabase
          .from('users')
          .update({ 
            current_set: nextSet,
            current_task: 1
          })
          .eq('user_id', user.user_id);
      }
    } catch (error) {
      console.error('❌ Error progressing to next task:', error);
    }
  };

  const addRewardToWallet = async (amount) => {
    try {
      const { error } = await supabase
        .from('wallets')
        .update({
          balance: supabase.raw(`balance + ${amount}`)
        })
        .eq('user_id', user.user_id);

      if (error) throw error;
      console.log(`💰 Added reward ₹${amount} to wallet`);
    } catch (error) {
      console.error('❌ Error adding reward to wallet:', error);
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'in_progress': return '#f59e0b';
      case 'assigned': return '#3b82f6';
      default: return '#6b7280';
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
        <p style={{ color: '#64748b', fontSize: '16px' }}>Loading your tasks...</p>
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          color: '#1e293b',
          margin: '0 0 8px 0'
        }}>
          My Tasks
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <p style={{
            fontSize: '16px',
            color: '#64748b',
            margin: 0
          }}>
            Complete tasks to earn rewards and progress through sets
          </p>
          <div style={{
            padding: '8px 16px',
            backgroundColor: '#f0f9ff',
            borderRadius: '6px',
            border: '1px solid #e0f2fe'
          }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#0369a1' }}>
              Set {currentSet} • Task {currentTask}
            </span>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div style={{ display: 'grid', gap: '16px' }}>
        {allTasks
          .filter(task => task.task_number <= currentTask) // Only show tasks up to current position
          .map((task) => (
            <div
              key={task.id}
              style={{
                backgroundColor: 'white',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                borderLeft: task.isPremium ? `4px solid #f59e0b` : `4px solid #3b82f6`,
                boxShadow: task.isPremium ? '0 2px 8px rgba(245, 158, 11, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
            >
              {/* Task Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#1e293b',
                      margin: 0
                    }}>
                      Set {task.set_number} - Task {task.task_number}
                    </h3>
                    
                    {/* Premium Badge */}
                    {task.isPremium && (
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '500',
                        backgroundColor: '#fef3c7',
                        color: '#92400e'
                      }}>
                        ⭐ PREMIUM TASK
                      </span>
                    )}

                    {/* Task Type Badge */}
                    {task.task_type && (
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
                    )}

                    {/* Difficulty Badge */}
                    {task.difficulty && (
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
                    )}

                    {/* Status Badge */}
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: getStatusColor(task.status) + '20',
                      color: getStatusColor(task.status)
                    }}>
                      {task.status === 'assigned' && '🔵 Assigned'}
                      {task.status === 'in_progress' && '🟡 In Progress'}
                      {task.status === 'completed' && '🟢 Completed'}
                    </span>
                  </div>

                  {/* Task Description */}
                  <p style={{
                    fontSize: '14px',
                    color: '#64748b',
                    margin: '0 0 12px 0',
                    lineHeight: '1.5'
                  }}>
                    {task.description}
                  </p>

                  {/* Instructions */}
                  {task.instructions && (
                    <div style={{
                      backgroundColor: '#f8fafc',
                      padding: '12px',
                      borderRadius: '6px',
                      marginBottom: '12px'
                    }}>
                      <p style={{
                        fontSize: '13px',
                        color: '#374151',
                        margin: '0 0 6px 0',
                        fontWeight: '500'
                      }}>
                        📝 Instructions:
                      </p>
                      <p style={{
                        fontSize: '13px',
                        color: '#64748b',
                        margin: 0,
                        lineHeight: '1.4'
                      }}>
                        {task.instructions}
                      </p>
                    </div>
                  )}

                  {/* Requirements */}
                  {task.requirements && (
                    <div style={{
                      backgroundColor: '#fffbeb',
                      padding: '12px',
                      borderRadius: '6px',
                      marginBottom: '12px'
                    }}>
                      <p style={{
                        fontSize: '13px',
                        color: '#92400e',
                        margin: '0 0 6px 0',
                        fontWeight: '500'
                      }}>
                        ⚡ Requirements:
                      </p>
                      <p style={{
                        fontSize: '13px',
                        color: '#b45309',
                        margin: 0,
                        lineHeight: '1.4'
                      }}>
                        {task.requirements}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Info and Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: '#64748b', flexWrap: 'wrap' }}>
                  <div>
                    <span>Reward: </span>
                    <strong style={{ color: '#10b981' }}>{formatCurrency(task.reward_amount)}</strong>
                  </div>
                  {task.isPremium && (
                    <>
                      <div>
                        <span>Penalty: </span>
                        <strong style={{ color: '#dc2626' }}>{formatCurrency(task.penalty_amount)}</strong>
                      </div>
                      <div>
                        <span>Pending: </span>
                        <strong style={{ color: '#f59e0b' }}>{formatCurrency(task.additional_pending)}</strong>
                      </div>
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  {task.status === 'assigned' && (
                    <button
                      onClick={() => handleStartTask(task.id, task.isPremium)}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: task.isPremium ? '#f59e0b' : '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      {task.isPremium ? 'Start Premium Task' : 'Start Task'}
                    </button>
                  )}

                  {task.status === 'in_progress' && (
                    <button
                      onClick={() => handleCompleteTask(task.id, task.isPremium)}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Complete Task
                    </button>
                  )}

                  {task.status === 'completed' && (
                    <span style={{
                      padding: '10px 20px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      ✅ Completed
                    </span>
                  )}
                </div>
              </div>

              {/* Premium Task Assignment Info */}
              {task.isPremium && task.premiumData?.assigned_at && (
                <div style={{ marginTop: '12px', fontSize: '12px', color: '#94a3b8' }}>
                  Premium task assigned on: {new Date(task.premiumData.assigned_at).toLocaleDateString('en-IN')}
                </div>
              )}
            </div>
          ))
        }

        {allTasks.filter(task => task.task_number <= currentTask).length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎯</div>
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b', margin: '0 0 8px 0' }}>
              No Tasks Available
            </h3>
            <p style={{ color: '#64748b', fontSize: '16px' }}>
              You've completed all available tasks in your current set.
            </p>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '8px' }}>
              Continue progressing to unlock more tasks!
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
        <strong>Current Position:</strong> Set {currentSet}, Task {currentTask} • 
        <strong> Total Tasks:</strong> {allTasks.length} • 
        <strong> Premium Tasks:</strong> {allTasks.filter(t => t.isPremium).length}
      </div>
    </div>
  );
}
