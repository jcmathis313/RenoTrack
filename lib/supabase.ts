import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    "Supabase URL or key not found. File uploads will fail. " +
    "Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables."
  )
}

export const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null

export const STORAGE_BUCKETS = {
  INSPECTIONS: "inspections",
  COMMUNITIES: "communities",
  CATALOG: "catalog",
} as const

