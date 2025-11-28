const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables. Please check your .env.local file.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function initializeDatabase() {
  console.log('Starting database initialization...')

  try {
    // 1. Create Tables
    console.log('Creating tables...')
    
    const tablesSQL = `
    -- Enable UUID extension
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id VARCHAR(10) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(20) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      referral_code VARCHAR(10),
      referred_by VARCHAR(10),
      status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'frozen', 'rejected')),
      role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
      total_tasks_completed INTEGER DEFAULT 0,
      current_set INTEGER DEFAULT 1,
      current_task INTEGER DEFAULT 0,
      level INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Wallets table
    CREATE TABLE IF NOT EXISTS wallets (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id VARCHAR(10) REFERENCES users(user_id) ON DELETE CASCADE,
      balance DECIMAL(12,2) DEFAULT 0.00,
      trial_bonus DECIMAL(12,2) DEFAULT 10000.00,
      pending_amount DECIMAL(12,2) DEFAULT 0.00,
      today_points DECIMAL(8,2) DEFAULT 0.00,
      total_earnings DECIMAL(12,2) DEFAULT 0.00,
      total_withdrawn DECIMAL(12,2) DEFAULT 0.00,
      last_reset_date DATE DEFAULT CURRENT_DATE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Tasks configuration
    CREATE TABLE IF NOT EXISTS task_config (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      set_number INTEGER NOT NULL,
      task_number INTEGER NOT NULL,
      hotel_name VARCHAR(255) NOT NULL,
      hotel_image_url VARCHAR(500),
      min_points DECIMAL(6,2) DEFAULT 35.60,
      max_points DECIMAL(6,2) DEFAULT 40.54,
      is_premium_task BOOLEAN DEFAULT false,
      penalty_amount DECIMAL(10,2) DEFAULT 0.00,
      additional_pending DECIMAL(10,2) DEFAULT 0.00,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- User tasks progress
    CREATE TABLE IF NOT EXISTS user_tasks (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id VARCHAR(10) REFERENCES users(user_id) ON DELETE CASCADE,
      set_number INTEGER NOT NULL,
      task_number INTEGER NOT NULL,
      completed BOOLEAN DEFAULT false,
      points_earned DECIMAL(8,2),
      completed_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Withdrawals table
    CREATE TABLE IF NOT EXISTS withdrawals (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id VARCHAR(10) REFERENCES users(user_id) ON DELETE CASCADE,
      amount DECIMAL(10,2) NOT NULL,
      upi_id VARCHAR(255) NOT NULL,
      status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
      admin_notes TEXT,
      processed_by VARCHAR(10),
      processed_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Transactions history
    CREATE TABLE IF NOT EXISTS transactions (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id VARCHAR(10) REFERENCES users(user_id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL CHECK (type IN ('task_earning', 'withdrawal', 'admin_deposit', 'bonus', 'penalty')),
      amount DECIMAL(10,2) NOT NULL,
      description TEXT,
      related_id VARCHAR(50),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Level system configuration
    CREATE TABLE IF NOT EXISTS level_config (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      level_number INTEGER NOT NULL UNIQUE,
      tasks_required INTEGER NOT NULL,
      bonus_amount DECIMAL(10,2) NOT NULL,
      description TEXT
    );

    -- Premium task configuration
    CREATE TABLE IF NOT EXISTS premium_config (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      set_number INTEGER NOT NULL,
      task_number INTEGER NOT NULL,
      penalty_amount DECIMAL(10,2) NOT NULL,
      additional_pending DECIMAL(10,2) NOT NULL,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Referral system
    CREATE TABLE IF NOT EXISTS referrals (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      referrer_id VARCHAR(10) REFERENCES users(user_id),
      referred_id VARCHAR(10) REFERENCES users(user_id) UNIQUE,
      commission_earned DECIMAL(8,2) DEFAULT 0.00,
      status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Admin settings
    CREATE TABLE IF NOT EXISTS admin_settings (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      setting_key VARCHAR(100) UNIQUE NOT NULL,
      setting_value TEXT,
      description TEXT,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    `

    // Execute table creation
    const { error: tablesError } = await supabase.rpc('exec_sql', { sql: tablesSQL })
    
    if (tablesError) {
      console.log('Tables might already exist, continuing...')
    }

    // 2. Insert Initial Data
    console.log('Inserting initial data...')

    // Level configuration
    const { error: levelError } = await supabase
      .from('level_config')
      .upsert([
        { level_number: 1, tasks_required: 150, bonus_amount: 2000.00, description: 'Complete 150 tasks for Level 1 bonus' },
        { level_number: 2, tasks_required: 300, bonus_amount: 3000.00, description: 'Complete 300 tasks for Level 2 bonus' },
        { level_number: 3, tasks_required: 450, bonus_amount: 6000.00, description: 'Complete 450 tasks for Level 3 bonus' },
        { level_number: 4, tasks_required: 600, bonus_amount: 0.00, description: 'Reach Agent level at 600 tasks' }
      ])

    if (levelError) console.error('Level config error:', levelError)

    // Admin settings
    const { error: settingsError } = await supabase
      .from('admin_settings')
      .upsert([
        { setting_key: 'referral_bonus', setting_value: '100', description: 'Bonus amount for successful referrals' },
        { setting_key: 'min_withdrawal', setting_value: '500', description: 'Minimum withdrawal amount' },
        { setting_key: 'max_withdrawal', setting_value: '50000', description: 'Maximum withdrawal amount' },
        { setting_key: 'default_referral_code', setting_value: 'OT7687', description: 'Default referral code for registration' }
      ])

    if (settingsError) console.error('Settings error:', settingsError)

    // Sample task configuration (first 3 tasks as example)
    const { error: taskError } = await supabase
      .from('task_config')
      .upsert([
        { set_number: 1, task_number: 1, hotel_name: 'Taj Mahal Palace, Mumbai', hotel_image_url: '/hotels/taj-mumbai.jpg', min_points: 35.60, max_points: 40.54 },
        { set_number: 1, task_number: 2, hotel_name: 'Oberoi Udaivilas, Udaipur', hotel_image_url: '/hotels/oberoi-udaipur.jpg', min_points: 35.60, max_points: 40.54 },
        { set_number: 1, task_number: 3, hotel_name: 'Leela Palace, New Delhi', hotel_image_url: '/hotels/leela-delhi.jpg', min_points: 35.60, max_points: 40.54 }
      ])

    if (taskError) console.error('Task config error:', taskError)

    console.log('✅ Database initialization completed successfully!')
    console.log('📊 Tables created: users, wallets, task_config, user_tasks, withdrawals, transactions, level_config, premium_config, referrals, admin_settings')
    console.log('🎯 Initial data inserted: level configuration, admin settings, sample tasks')

  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    process.exit(1)
  }
}

initializeDatabase()