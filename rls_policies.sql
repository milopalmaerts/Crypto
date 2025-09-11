-- Row Level Security (RLS) Policies for CryptoTracker
-- Run these commands in your Supabase SQL editor

-- First, ensure RLS is enabled on the tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE holdings ENABLE ROW LEVEL SECURITY;

-- Users table policies
-- Users can only see and update their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert their own profile (for registration)
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Holdings table policies
-- Users can only see their own holdings
CREATE POLICY "Users can view own holdings" ON holdings
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own holdings
CREATE POLICY "Users can insert own holdings" ON holdings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own holdings
CREATE POLICY "Users can update own holdings" ON holdings
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own holdings
CREATE POLICY "Users can delete own holdings" ON holdings
  FOR DELETE USING (auth.uid() = user_id);

-- Optional: Create a function to automatically set user_id when inserting holdings
-- This ensures the user_id is always set to the authenticated user
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically set user_id
CREATE TRIGGER set_user_id_trigger
  BEFORE INSERT ON holdings
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

-- Grant necessary permissions for authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON users TO authenticated;
GRANT ALL ON holdings TO authenticated;

-- Grant usage on sequences (for auto-generated IDs)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;