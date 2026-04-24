// supabase.js — Supabase client initialization

// Your Project URL from Supabase → Settings → General → Reference ID
const SUPABASE_URL = 'https://cvzxelgpcmbuizdhegqn.supabase.co';

// Your anon public key from Supabase → Settings → API Keys → Legacy tab
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2enhlbGdwY21idWl6ZGhlZ3FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzI1MDUsImV4cCI6MjA5MjU0ODUwNX0.GMWC8FkSEK6yXYlhZQCbfJwL6GEad6rPjDEiht0rWzAXVCJ9...';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);