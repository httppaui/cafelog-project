// supabase.js — Supabase client initialization

const SUPABASE_URL = 'https://cvzxelgpcmbuizdhegqn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2enhlbGdwY21idWl6ZGhlZ3FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzI1MDUsImV4cCI6MjA5MjU0ODUwNX0.GMWC8FkSEK6yXYlhZQCbfJwL6GEad6rPjDEiht0rWzA';

window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);