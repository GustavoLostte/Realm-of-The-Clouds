import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL || 'https://ugdzhydclffxwaflomex.supabase.co'
// Prefer service role key for backend admin operations, fallback to anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_eqTBcAWlley9TbPyP3v89Q_J3cDJJZL'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

console.log('📡 [Server DB] Connected to Supabase:', supabaseUrl)
