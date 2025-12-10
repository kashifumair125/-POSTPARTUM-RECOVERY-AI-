import { createClient } from '@supabase/supabase-js';
import { AppState } from '../types';

// Configured with provided credentials.
// We keep process.env as a priority for security in different environments,
// but fall back to the provided keys for immediate functionality.
const supabaseUrl = process.env.SUPABASE_URL || 'https://hxdoeaocfssoktyphnsn.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4ZG9lYW9jZnNzb2t0eXBobnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNDM3MDksImV4cCI6MjA4MDkxOTcwOX0.8o20K2mdNiS-4Kv23zIEAtPAUGXnxPPQ9i5N8eCTZDc';

export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

// Table schema assumption:
// table: user_progress
// columns: user_id (uuid, PK), data (jsonb), updated_at (timestamp)

export const saveCloudData = async (userId: string, data: AppState) => {
  if (!supabase) return;
  
  const { error } = await supabase
    .from('user_progress')
    .upsert({ 
      user_id: userId, 
      data: data, 
      updated_at: new Date().toISOString() 
    }, { 
      onConflict: 'user_id' 
    });

  if (error) {
    console.error('Cloud save failed:', error.message);
  }
};

export const loadCloudData = async (userId: string): Promise<AppState | null> => {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('user_progress')
    .select('data')
    .eq('user_id', userId)
    .single();
  
  if (error) {
    // It's normal to have no data for a new user
    if (error.code !== 'PGRST116') {
      console.error('Cloud load failed:', error.message);
    }
    return null;
  }
  
  return data?.data as AppState;
};

export const isSupabaseConfigured = () => !!supabase;