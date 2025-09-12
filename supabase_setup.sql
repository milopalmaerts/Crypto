-- EindRersult Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create holdings table
CREATE TABLE IF NOT EXISTS holdings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    crypto_id VARCHAR(255) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(20, 8) NOT NULL DEFAULT 0,
    avg_price DECIMAL(20, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_holdings_user_id ON holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_holdings_crypto_id ON holdings(crypto_id);
CREATE INDEX IF NOT EXISTS idx_holdings_user_crypto ON holdings(user_id, crypto_id);

-- Create RLS (Row Level Security) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE holdings ENABLE ROW LEVEL SECURITY;

-- Users can only see their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (id = auth.uid());

-- Holdings policies
CREATE POLICY "Users can view own holdings" ON holdings
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own holdings" ON holdings
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own holdings" ON holdings
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own holdings" ON holdings
    FOR DELETE USING (user_id = auth.uid());

-- Note: Since we're using custom JWT authentication instead of Supabase auth,
-- we may need to adjust these policies or disable RLS for service role access

-- For development/testing, you might want to disable RLS temporarily:
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE holdings DISABLE ROW LEVEL SECURITY;