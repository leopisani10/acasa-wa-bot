/*
  # Criar tabela de funcionários de sobreaviso

  1. Nova Tabela
    - `sobreaviso_employees`
      - `id` (uuid, primary key)
      - `full_name` (text, required)
      - `cpf` (text, unique, required)
      - `position` (text, required)
      - `phone` (text, required)
      - `pix` (text, optional)
      - `unit` (text, required - Botafogo, Tijuca, ou Ambas)
      - `status` (text, required - Ativo ou Inativo)
      - `observations` (text, optional)
      - `created_by` (uuid, foreign key to users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Segurança
    - Habilitar RLS na tabela `sobreaviso_employees`
    - Políticas para usuários autenticados criarem/editarem/visualizarem

  3. Índices
    - Índice no CPF para consultas rápidas
    - Índice no status para filtros
    - Índice na unidade para filtros
*/

-- Criar tabela de funcionários de sobreaviso
CREATE TABLE IF NOT EXISTS sobreaviso_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  cpf text UNIQUE NOT NULL,
  position text NOT NULL,
  phone text NOT NULL,
  pix text,
  unit text NOT NULL CHECK (unit = ANY (ARRAY['Botafogo'::text, 'Tijuca'::text, 'Ambas'::text])),
  status text NOT NULL DEFAULT 'Ativo'::text CHECK (status = ANY (ARRAY['Ativo'::text, 'Inativo'::text])),
  observations text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE sobreaviso_employees ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
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
    (auth.uid() = created_by) OR 
    (EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::text
    ))
  );

CREATE POLICY "Users can delete sobreaviso employees they created or admins can delete all"
  ON sobreaviso_employees
  FOR DELETE
  TO authenticated
  USING (
    (auth.uid() = created_by) OR 
    (EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::text
    ))
  );

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_sobreaviso_employees_cpf 
ON sobreaviso_employees USING btree (cpf);

CREATE INDEX IF NOT EXISTS idx_sobreaviso_employees_status 
ON sobreaviso_employees USING btree (status);

CREATE INDEX IF NOT EXISTS idx_sobreaviso_employees_unit 
ON sobreaviso_employees USING btree (unit);

-- Trigger para updated_at
CREATE TRIGGER sobreaviso_employees_updated_at
  BEFORE UPDATE ON sobreaviso_employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();