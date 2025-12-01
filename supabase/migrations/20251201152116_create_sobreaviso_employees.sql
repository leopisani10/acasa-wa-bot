/*
  # Create Sobreaviso Employees Table

  ## Overview
  Creates table for managing on-call/contract workers (curingas) who work shifts.
  
  ## Tables Created
  
  ### sobreaviso_employees
  - `id` (uuid, primary key)
  - `full_name` (text) - Employee full name
  - `cpf` (text) - CPF document number
  - `position` (text) - Job position/role
  - `phone` (text) - Contact phone
  - `pix` (text, optional) - PIX key for payments
  - `unit` (text) - Work unit (Botafogo, Ambas)
  - `status` (text) - Active or Inactive
  - `observations` (text, optional) - Additional notes
  - `created_by` (uuid) - User who created the record
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS
  - Add policies for authenticated users to manage records
*/

-- Create sobreaviso_employees table
CREATE TABLE IF NOT EXISTS sobreaviso_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  cpf text NOT NULL,
  position text NOT NULL,
  phone text NOT NULL,
  pix text,
  unit text NOT NULL,
  status text NOT NULL DEFAULT 'Ativo',
  observations text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE sobreaviso_employees ENABLE ROW LEVEL SECURITY;

-- Policies for sobreaviso_employees
CREATE POLICY "Users can view sobreaviso employees"
  ON sobreaviso_employees FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert sobreaviso employees"
  ON sobreaviso_employees FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update sobreaviso employees"
  ON sobreaviso_employees FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete sobreaviso employees"
  ON sobreaviso_employees FOR DELETE
  TO authenticated
  USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sobreaviso_employees_status ON sobreaviso_employees(status);
CREATE INDEX IF NOT EXISTS idx_sobreaviso_employees_unit ON sobreaviso_employees(unit);
CREATE INDEX IF NOT EXISTS idx_sobreaviso_employees_cpf ON sobreaviso_employees(cpf);

-- Update trigger
CREATE OR REPLACE FUNCTION update_sobreaviso_employees_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sobreaviso_employees_updated_at
  BEFORE UPDATE ON sobreaviso_employees
  FOR EACH ROW
  EXECUTE FUNCTION update_sobreaviso_employees_updated_at();
