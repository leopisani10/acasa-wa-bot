/*
  # Fix profiles UPDATE policy to prevent infinite recursion

  This migration fixes the RLS policies for the profiles table to prevent infinite recursion
  when updating user profiles. The issue was caused by the UPDATE policy trying to check
  if a user is admin by querying the same profiles table, creating a circular dependency.

  1. Security Changes
    - Drop existing problematic UPDATE policy
    - Create new simplified UPDATE policy that allows users to update their own profile
    - Maintain admin privileges through service role access
*/

-- Drop the problematic UPDATE policy that causes infinite recursion
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create a simple UPDATE policy that allows users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Ensure the SELECT policy is correct and doesn't cause recursion
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;

CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Ensure the INSERT policy is correct
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);