
import { createClient } from '@supabase/supabase-js';
import { AppState } from '../types';

// For production, these MUST be set in your deployment platform (Vercel, Netlify, etc.)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Cast to 'any' to bypass TypeScript errors where v1 types (SupabaseAuthClient) 
// conflict with v2 method usage (getSession, signInWithPassword, etc.)
export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) as any
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
