/*
  # Create sobreaviso_employees table

  1. New Tables
    - `sobreaviso_employees`
      - `id` (uuid, primary key)
      - `full_name` (text, required)
      - `cpf` (text, unique, required)
      - `position` (text, required)
      - `phone` (text, required)
      - `pix` (text, optional)
      - `unit` (text, required with constraints)
      - `status` (text, required with constraints)
      - `observations` (text, optional)
      - `created_by` (uuid, foreign key to users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      
  2. Security
    - Enable RLS on `sobreaviso_employees` table
    - Add policies for authenticated users to manage data
    
  3. Indexes
    - Add indexes for common queries on unit and status
*/

-- Create sobreaviso_employees table
CREATE TABLE IF NOT EXISTS sobreaviso_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  cpf text UNIQUE NOT NULL,
  position text NOT NULL,
  phone text NOT NULL,
  pix text,
  unit text NOT NULL CHECK (unit IN ('Botafogo', 'Tijuca', 'Ambas')),
  status text NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo')),
  observations text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE sobreaviso_employees ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can create sobreaviso employees"
  ON sobreaviso_employees
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can read sobreaviso employees"
  ON sobreaviso_employees
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update sobreaviso employees they created or admins can update all"
  ON sobreaviso_employees
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
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
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER sobreaviso_employees_updated_at
  BEFORE UPDATE ON sobreaviso_employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sobreaviso_employees_unit ON sobreaviso_employees(unit);
CREATE INDEX IF NOT EXISTS idx_sobreaviso_employees_status ON sobreaviso_employees(status);
CREATE INDEX IF NOT EXISTS idx_sobreaviso_employees_cpf ON sobreaviso_employees(cpf);