/*
  # Add INSERT policy for profiles table

  1. Security Changes
    - Add policy to allow authenticated users to insert their own profile during registration
    - This enables the registration flow to work properly by allowing users to create their profile record

  2. Policy Details
    - Allows INSERT operations on profiles table for authenticated users
    - Restricts users to only insert profiles where the id matches their auth.uid()
    - This ensures users can only create their own profile, not profiles for other users
*/

-- Add INSERT policy for profiles table to allow user registration
CREATE POLICY "Users can insert own profile during registration"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);