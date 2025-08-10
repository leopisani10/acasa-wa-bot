/*
  # Fix profiles table INSERT policy

  1. Security
    - Drop existing INSERT policy that uses uid()
    - Create new INSERT policy using auth.uid() for proper authentication
    - Ensure users can create their own profile during registration
*/

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Users can insert own profile during registration" ON profiles;

-- Create a new INSERT policy that properly uses auth.uid()
CREATE POLICY "Users can insert own profile during registration"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);