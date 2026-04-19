import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://aiulcycosynvrriabpqg.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpdWxjeWNvc3ludnJyaWFicHFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1NDUwNDYsImV4cCI6MjA5MjEyMTA0Nn0.5JJXT5p8k3eNG6vlwO9fXOhQvGZD5pLxEc4hNafoMtM'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
