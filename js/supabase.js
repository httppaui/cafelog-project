// supabase.js — Supabase client initialization

const SUPABASE_URL = 'https://your-actual-url.supabase.co';
const SUPABASE_KEY = 'your-actual-anon-key';

window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);