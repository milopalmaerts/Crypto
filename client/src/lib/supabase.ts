import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fnggwmxkdgwxsbjekics.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuZ2d3bXhrZGd3eHNiamVraWNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1Mjg1NjUsImV4cCI6MjA3MzEwNDU2NX0.EGubRmswEmLJXqysazlvhmrfRdpqNMtsla3pBV_uSgk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Database types for better TypeScript support
export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface CryptoHolding {
  id: string;
  user_id: string;
  crypto_id: string;
  symbol: string;
  name: string;
  amount: number;
  avg_price: number;
  created_at: string;
  updated_at: string;
}

// Helper functions for database operations
export const dbHelpers = {
  users: {
    async getProfile(userId: string) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    }
  },
  
  holdings: {
    async getAll(userId: string) {
      const { data, error } = await supabase
        .from('holdings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    
    async create(holding: Omit<CryptoHolding, 'id' | 'created_at' | 'updated_at'>) {
      const { data, error } = await supabase
        .from('holdings')
        .insert([holding])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    
    async update(id: string, updates: Partial<CryptoHolding>) {
      const { data, error } = await supabase
        .from('holdings')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    
    async delete(id: string) {
      const { error } = await supabase
        .from('holdings')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    }
  }
};