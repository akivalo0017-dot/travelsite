const { createClient } = require('@supabase/supabase-js')
const fs = require('fs').promises
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function migrateData() {
  try {
    console.log('Starting data migration from JSON to Supabase...')
    
    // Read JSON files
    const usersData = await fs.readFile(path.join(__dirname, '../data/users.json'), 'utf8')
    const users = JSON.parse(usersData)
    
    console.log(`Migrating ${users.length} users...`)
    
    for (const user of users) {
      // Insert user
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          user_id: user.userId,
          name: user.name,
          phone: user.phone,
          password: user.password,
          referral_code: user.referralCode,
          status: user.status,
          role: user.role,
          total_tasks_completed: user.totalTasksCompleted || 0,
          current_set: user.currentSet || 1,
          current_task: user.currentTask || 0,
          level: user.level || 0
        })
        .select()
        .single()
      
      if (userError && !userError.message.includes('duplicate key')) {
        console.error('Error migrating user:', user.userId, userError)
      } else if (userData) {
        console.log('Migrated user:', user.userId)
      }
    }
    
    console.log('✅ Data migration completed!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
  }
}

migrateData()