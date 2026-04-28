import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('--- PROFILES ---');
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('*');
  console.log(profiles, pErr);

  console.log('--- HOUSEHOLDS ---');
  const { data: households, error: hErr } = await supabase.from('households').select('*');
  console.log(households, hErr);
  
  console.log('--- AUTH USERS ---');
  const { data: authUsers, error: uErr } = await supabase.auth.admin.listUsers();
  console.log(authUsers?.users.map(u => ({ id: u.id, email: u.email })), uErr);
}

run();
