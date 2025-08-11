/*
  # Fix infinite recursion in profiles RLS policies

  The current RLS policies are causing infinite recursion because they reference
  the profiles table from within the profiles table policy, creating a loop.

  1. Drop all existing policies
  2. Create simple, non-recursive policies
  3. Allow authenticated users to read their own profile
  4. Allow service role full access for admin operations
*/

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create simple policies that don't cause recursion
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role can bypass RLS for administrative operations
CREATE POLICY "Service role full access"
  ON profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);