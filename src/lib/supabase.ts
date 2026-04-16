import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cexsxfkbfrlnyloktwlt.supabase.co'
const supabaseAnonKey = 'sb_publishable_69HJ6Tz3DpIeevS5ocXs-A_lMtYSxdw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)