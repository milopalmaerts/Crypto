-- Additional SQL commands to run in Supabase SQL Editor
-- Since we're using custom JWT authentication, disable RLS for service role access

-- Disable Row Level Security for development
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE holdings DISABLE ROW LEVEL SECURITY;

-- Optional: Drop the existing RLS policies since we're not using Supabase auth
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view own holdings" ON holdings;
DROP POLICY IF EXISTS "Users can insert own holdings" ON holdings;
DROP POLICY IF EXISTS "Users can update own holdings" ON holdings;
DROP POLICY IF EXISTS "Users can delete own holdings" ON holdings;

-- Verify tables were created correctly
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('users', 'holdings')
ORDER BY table_name, ordinal_position;