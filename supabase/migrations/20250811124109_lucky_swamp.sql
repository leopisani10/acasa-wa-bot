/*
  # Fix User Management RLS Policies

  1. Security Updates
    - Add policy for admins to read all profiles
    - Keep existing policy for users to read own profile
    - Ensure proper access control for user management

  2. Changes
    - Create new policy "Admins can read all profiles"
    - Allow users with admin role to access all profile data
    - Maintain security for non-admin users
*/

-- Add policy for admins to read all profiles
CREATE POLICY "Admins can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Allow if user is reading their own profile OR if user is admin
    (auth.uid() = id) OR 
    (EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    ))
  );

-- Drop the old restrictive policy that only allowed reading own profile
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;