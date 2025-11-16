import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cjenrxiwoanelwdbqkma.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqZW5yeGl3b2FuZWx3ZGJxa21hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MzI5NjcsImV4cCI6MjA3ODUwODk2N30.WjdsSYe-SLfyG9GcKOoaui-kCZnl8XlZKjLqB9F8cvw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

