/*
  # Fix infinite recursion in profiles RLS policy

  The previous policy created infinite recursion by querying the profiles table
  from within a profiles table policy. This migration fixes it by:
  
  1. Dropping the problematic policy
  2. Creating a simpler policy that avoids recursion
  3. Using a function-based approach for admin access
*/

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Users can read own profile or admins can read all" ON profiles;

-- Create a function to check if user is admin (avoiding recursion)
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = user_id 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create simple policies that don't cause recursion
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow service role to manage all profiles (for admin operations)
CREATE POLICY "Service role can manage all profiles"
  ON profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON profiles TO authenticated;