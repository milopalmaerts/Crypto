-- CryptoTracker Database Schema for Supabase
-- Run this script in your Supabase SQL Editor

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create holdings table
CREATE TABLE IF NOT EXISTS holdings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  crypto_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  avg_price DECIMAL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_holdings_user_id ON holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_holdings_crypto_id ON holdings(crypto_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE holdings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
-- Note: Since we're using JWT tokens from our backend (not Supabase Auth),
-- we'll keep these policies simple for now

-- Allow users to read their own data (this will be handled by the backend JWT)
CREATE POLICY "Enable read access for users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for registration" ON users
  FOR INSERT WITH CHECK (true);

-- Create RLS policies for holdings table
CREATE POLICY "Enable all access for holdings" ON holdings
  FOR ALL USING (true);

-- Note: Since we're using our custom JWT authentication instead of Supabase Auth,
-- we're keeping the policies open and relying on our backend to enforce user isolation.
-- In a production environment, you might want to tighten these policies.

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update the updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_holdings_updated_at BEFORE UPDATE ON holdings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();