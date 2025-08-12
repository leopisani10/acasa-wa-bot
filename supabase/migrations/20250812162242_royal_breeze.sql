/*
  # Create sobreaviso_employees table

  1. New Tables
    - `sobreaviso_employees`
      - `id` (uuid, primary key)
      - `full_name` (text, not null)
      - `cpf` (text, unique, not null)
      - `position` (text, not null)
      - `phone` (text, not null)
      - `pix` (text, optional)
      - `unit` (text, not null) - Botafogo, Tijuca, or Ambas
      - `status` (text, not null) - Ativo or Inativo
      - `observations` (text, optional)
      - `created_by` (uuid, foreign key to users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `sobreaviso_employees` table
    - Add policy for authenticated users to read all records
    - Add policy for authenticated users to create records they own
    - Add policy for users to update/delete records they created or admins can manage all

  3. Changes
    - Added indexes for performance on cpf, unit, status
    - Added check constraints for unit and status values
    - Added trigger for automatic updated_at timestamp
*/

CREATE TABLE IF NOT EXISTS sobreaviso_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  cpf text UNIQUE NOT NULL,
  position text NOT NULL,
  phone text NOT NULL,
  pix text,
  unit text NOT NULL,
  status text NOT NULL DEFAULT 'Ativo',
  observations text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add check constraints
ALTER TABLE sobreaviso_employees ADD CONSTRAINT sobreaviso_employees_unit_check 
CHECK (unit = ANY (ARRAY['Botafogo'::text, 'Tijuca'::text, 'Ambas'::text]));

ALTER TABLE sobreaviso_employees ADD CONSTRAINT sobreaviso_employees_status_check 
CHECK (status = ANY (ARRAY['Ativo'::text, 'Inativo'::text]));

-- Add foreign key constraint
ALTER TABLE sobreaviso_employees ADD CONSTRAINT sobreaviso_employees_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES users(id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_sobreaviso_employees_cpf ON sobreaviso_employees USING btree (cpf);
CREATE INDEX IF NOT EXISTS idx_sobreaviso_employees_unit ON sobreaviso_employees USING btree (unit);
CREATE INDEX IF NOT EXISTS idx_sobreaviso_employees_status ON sobreaviso_employees USING btree (status);

-- Enable RLS
ALTER TABLE sobreaviso_employees ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can read sobreaviso employees"
  ON sobreaviso_employees
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create sobreaviso employees"
  ON sobreaviso_employees
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update sobreaviso employees they created or admins can update all"
  ON sobreaviso_employees
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = created_by OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can delete sobreaviso employees they created or admins can delete all"
  ON sobreaviso_employees
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = created_by OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER sobreaviso_employees_updated_at
  BEFORE UPDATE ON sobreaviso_employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();