/*
  # Tabela de NF + RDA

  1. Nova Tabela
    - `nfrda_entries` - Controle de notas fiscais e relatórios de atividade

  2. Segurança
    - Enable RLS na tabela
    - Usuários autenticados podem ler entradas
    - Apenas criador ou admin pode editar/deletar
*/

-- Criar tabela de entradas NF + RDA
CREATE TABLE IF NOT EXISTS nfrda_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id uuid REFERENCES employees(id), -- Referência ao colaborador contratado/terceirizado
  contractor_name text NOT NULL, -- Cache do nome para performance
  unit text NOT NULL CHECK (unit IN ('Botafogo', 'Tijuca')),
  reference_month integer NOT NULL CHECK (reference_month BETWEEN 1 AND 12),
  reference_year integer NOT NULL CHECK (reference_year BETWEEN 2020 AND 2030),
  activity_report_upload text, -- URL do RDA
  invoice_upload text, -- URL da NF
  delivery_status text NOT NULL DEFAULT 'Aguardando NF/RDA' CHECK (delivery_status IN ('Aguardando NF/RDA', 'Sim', 'Não', 'Desconto', 'Congelado', 'Erro', 'Sumiu')),
  payment_status text NOT NULL DEFAULT 'Não' CHECK (payment_status IN ('Sim', 'Não', 'Parcial', 'Congelado')),
  payment_date date,
  last_update timestamptz DEFAULT now(),
  
  -- Metadados
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE nfrda_entries ENABLE ROW LEVEL SECURITY;

-- Políticas para nfrda_entries
CREATE POLICY "Authenticated users can read nfrda entries"
  ON nfrda_entries
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create nfrda entries"
  ON nfrda_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update nfrda entries they created or admins can update all"
  ON nfrda_entries
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can delete nfrda entries they created or admins can delete all"
  ON nfrda_entries
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger para atualizar last_update
CREATE OR REPLACE FUNCTION update_nfrda_last_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_update = now();
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER nfrda_entries_last_update
  BEFORE UPDATE ON nfrda_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_nfrda_last_update();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_nfrda_entries_contractor_id ON nfrda_entries(contractor_id);
CREATE INDEX IF NOT EXISTS idx_nfrda_entries_unit ON nfrda_entries(unit);
CREATE INDEX IF NOT EXISTS idx_nfrda_entries_reference ON nfrda_entries(reference_year, reference_month);
CREATE INDEX IF NOT EXISTS idx_nfrda_entries_delivery_status ON nfrda_entries(delivery_status);
CREATE INDEX IF NOT EXISTS idx_nfrda_entries_payment_status ON nfrda_entries(payment_status);

-- Constraint único para evitar duplicatas
ALTER TABLE nfrda_entries 
ADD CONSTRAINT unique_contractor_month_year 
UNIQUE (contractor_id, reference_month, reference_year);