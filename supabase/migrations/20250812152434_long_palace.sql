/*
  # Create sobreaviso employees table

  1. New Tables
    - `sobreaviso_employees`
      - `id` (uuid, primary key)
      - `full_name` (text, required)
      - `cpf` (text, required, unique)
      - `position` (text, required)
      - `phone` (text, required)
      - `pix` (text, optional)
      - `unit` (text, required - Botafogo, Tijuca, or Ambas)
      - `status` (text, required - Ativo or Inativo, default: Ativo)
      - `observations` (text, optional)
      - `created_by` (uuid, foreign key to users)
      - `created_at` (timestamp, default: now)
      - `updated_at` (timestamp, default: now)

  2. Security
    - Enable RLS on `sobreaviso_employees` table
    - Add policies for authenticated users to manage their own records
    - Allow admins to manage all records

  3. Indexes
    - Index on CPF for fast lookups
    - Index on unit for filtering
    - Index on status for active/inactive filtering
*/

-- Create sobreaviso_employees table
CREATE TABLE IF NOT EXISTS sobreaviso_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  cpf text UNIQUE NOT NULL,
  position text NOT NULL,
  phone text NOT NULL,
  pix text,
  unit text NOT NULL CHECK (unit = ANY (ARRAY['Botafogo'::text, 'Tijuca'::text, 'Ambas'::text])),
  status text NOT NULL DEFAULT 'Ativo' CHECK (status = ANY (ARRAY['Ativo'::text, 'Inativo'::text])),
  observations text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE sobreaviso_employees ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sobreaviso_employees_cpf ON sobreaviso_employees(cpf);
CREATE INDEX IF NOT EXISTS idx_sobreaviso_employees_unit ON sobreaviso_employees(unit);
CREATE INDEX IF NOT EXISTS idx_sobreaviso_employees_status ON sobreaviso_employees(status);

-- Create RLS policies
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

-- Create trigger for updated_at
CREATE TRIGGER sobreaviso_employees_updated_at
  BEFORE UPDATE ON sobreaviso_employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();