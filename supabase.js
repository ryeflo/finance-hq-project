import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vhdysqsjjsssfvhfbbjs.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoZHlzcXNqanNzc2Z2aGZiYmpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NTQ3NzUsImV4cCI6MjA5MTMzMDc3NX0.2V2NsO0vZO3RNHQV6rshVRl9caknAIqYoYQ1riZRlhQ'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Load data from Supabase
export async function loadData() {
  const { data, error } = await supabase
    .from('finance_data')
    .select('data')
    .eq('id', 'ryan')
    .single()

  if (error) {
    console.error('Load error:', error)
    return null
  }
  return data?.data || null
}

// Save data to Supabase
export async function saveData(financeData) {
  const { error } = await supabase
    .from('finance_data')
    .upsert({
      id: 'ryan',
      data: financeData,
      updated_at: new Date().toISOString()
    })

  if (error) {
    console.error('Save error:', error)
    return false
  }
  return true
}
