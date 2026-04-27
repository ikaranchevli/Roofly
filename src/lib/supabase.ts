import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Provide placeholder values so the app renders without crashing.
// Data operations will fail until real credentials are configured.
const url = supabaseUrl || 'https://placeholder.supabase.co';
const key = supabaseAnonKey || 'placeholder-anon-key';

export const supabase = createClient(url, key);

export const DOCUMENTS_BUCKET = 'tenant-documents';

/** True when real Supabase credentials are configured */
export const isSupabaseConfigured =
  !!supabaseUrl && supabaseUrl !== 'your_supabase_project_url' &&
  !!supabaseAnonKey && supabaseAnonKey !== 'your_supabase_anon_key';
