// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL; // .env dosyanızda tanımlı olmalı
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY; // .env dosyanızda tanımlı olmalı

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
