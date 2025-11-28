const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Sample hotel data for 90 tasks
const hotels = [
  { name: 'Taj Mahal Palace, Mumbai', image: '/hotels/taj-mumbai.jpg' },
  { name: 'Oberoi Udaivilas, Udaipur', image: '/hotels/oberoi-udaipur.jpg' },
  { name: 'Leela Palace, New Delhi', image: '/hotels/leela-delhi.jpg' },
  { name: 'Rambagh Palace, Jaipur', image: '/hotels/rambagh-jaipur.jpg' },
  { name: 'ITC Grand Chola, Chennai', image: '/hotels/itc-chennai.jpg' },
  { name: 'Taj Falaknuma Palace, Hyderabad', image: '/hotels/taj-hyderabad.jpg' },
  { name: 'Wildflower Hall, Shimla', image: '/hotels/wildflower-shimla.jpg' },
  { name: 'Taj Lake Palace, Udaipur', image: '/hotels/taj-lake-palace.jpg' },
  { name: 'The St. Regis, Mumbai', image: '/hotels/st-regis-mumbai.jpg' },
  { name: 'Four Seasons, Bangalore', image: '/hotels/four-seasons-bangalore.jpg' },
  // Add 80 more hotels here...
]

async function seedTasks() {
  console.log('Seeding task configuration...')
  
  const tasks = []
  
  // Create 90 tasks (3 sets of 30)
  for (let set = 1; set <= 3; set++) {
    for (let task = 1; task <= 30; task++) {
      const hotelIndex = ((set - 1) * 30 + (task - 1)) % hotels.length
      tasks.push({
        set_number: set,
        task_number: task,
        hotel_name: hotels[hotelIndex].name,
        hotel_image_url: hotels[hotelIndex].image,
        min_points: 35.60,
        max_points: 40.54,
        is_premium_task: false
      })
    }
  }
  
  // Add some premium tasks
  tasks[14].is_premium_task = true  // Set 1, Task 15
  tasks[14].penalty_amount = 5000
  tasks[14].additional_pending = 2000
  
  tasks[44].is_premium_task = true  // Set 2, Task 15
  tasks[44].penalty_amount = 8000
  tasks[44].additional_pending = 3000
  
  tasks[74].is_premium_task = true  // Set 3, Task 15
  tasks[74].penalty_amount = 12000
  tasks[74].additional_pending = 5000
  
  try {
    const { error } = await supabase
      .from('task_config')
      .upsert(tasks)
    
    if (error) {
      console.error('Error seeding tasks:', error)
    } else {
      console.log(`✅ Successfully seeded ${tasks.length} tasks!`)
    }
  } catch (error) {
    console.error('Seeding failed:', error)
  }
}

seedTasks()