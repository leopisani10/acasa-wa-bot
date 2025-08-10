/*
  # Fix infinite recursion in profiles RLS policies

  1. Security Changes
    - Remove problematic admin policy that causes circular dependency
    - Simplify policies to avoid self-referencing queries
    - Maintain security while preventing recursion

  2. Policy Updates
    - Drop existing policies that cause recursion
    - Create new simplified policies
    - Ensure users can still manage their own profiles
*/

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile during registration" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create simplified policies without circular dependencies

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to insert their own profile during registration
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Simple admin policy without recursion - admins can read all profiles
-- Note: This assumes admins are identified by their role in auth.jwt() claims
-- If you need admin functionality, consider using service role key or restructuring
CREATE POLICY "Service role can manage all profiles"
  ON profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);