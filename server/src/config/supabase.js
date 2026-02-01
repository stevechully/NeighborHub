import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Admin client (bypasses RLS – use carefully)
export const supabaseAdmin = createClient(
  supabaseUrl,
  serviceRoleKey
);

// User-scoped client (RLS enforced)
export const createUserSupabaseClient = (jwt) =>
  createClient(supabaseUrl, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    },
  });

