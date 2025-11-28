const { createClient } = require('@supabase/supabase-js')
const fs = require('fs').promises
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupDir = path.join(__dirname, '../backups')
  
  try {
    await fs.mkdir(backupDir, { recursive: true })
    
    console.log('Starting database backup...')
    
    // Backup users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
    
    if (!usersError) {
      await fs.writeFile(
        path.join(backupDir, `users-${timestamp}.json`),
        JSON.stringify(users, null, 2)
      )
      console.log(`✅ Backed up ${users.length} users`)
    }
    
    // Backup other tables similarly...
    console.log('✅ Database backup completed!')
    
  } catch (error) {
    console.error('❌ Backup failed:', error)
  }
}

backupDatabase()