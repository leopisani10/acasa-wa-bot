/*
  # Create check_table_exists function

  1. New Functions
    - `check_table_exists(table_name)` - Function to check if a table exists in the public schema
  
  2. Security
    - Function is accessible to authenticated users
    - Returns boolean indicating table existence
*/

-- Function to check if a table exists
CREATE OR REPLACE FUNCTION public.check_table_exists(table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = $1
  );
END;
$$;