/*
  # Fix Infinite Recursion in Profiles RLS Policy

  1. Problem
    - The "Admins can read all profiles" policy causes infinite recursion
    - It queries the profiles table within its own policy check
    - This prevents users from logging in successfully

  2. Solution
    - Drop the problematic recursive policy
    - Create a new policy that allows users to read their own profile only
    - Admin functionality will be handled at application level if needed

  3. Security
    - Users can only read their own profile data
    - Service role maintains full access
    - No recursive queries that could cause infinite loops
*/

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;

-- Create a simple, non-recursive policy for reading profiles
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);
