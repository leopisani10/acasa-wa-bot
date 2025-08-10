/*
  # Tabela da Escala de Katz

  1. Novas Tabelas
    - `katz_evaluations` - Avaliações da escala de Katz
    - `katz_activities` - Atividades avaliadas (6 atividades básicas)

  2. Segurança
    - Enable RLS em todas as tabelas
    - Usuários autenticados podem ler avaliações
    - Apenas criador ou admin pode editar/deletar
*/

-- Criar tabela de avaliações Katz
CREATE TABLE IF NOT EXISTS katz_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id uuid REFERENCES guests(id) ON DELETE CASCADE,
  evaluation_date date NOT NULL,
  evaluator_name text NOT NULL,
  evaluator_position text NOT NULL,
  
  -- Pontuações das 6 atividades (0 = dependente, 1 = independente)
  bathing_score integer NOT NULL CHECK (bathing_score IN (0, 1)),
  dressing_score integer NOT NULL CHECK (dressing_score IN (0, 1)),
  toileting_score integer NOT NULL CHECK (toileting_score IN (0, 1)),
  transferring_score integer NOT NULL CHECK (transferring_score IN (0, 1)),
  continence_score integer NOT NULL CHECK (continence_score IN (0, 1)),
  feeding_score integer NOT NULL CHECK (feeding_score IN (0, 1)),
  
  -- Pontuação total (0-6)
  total_score integer GENERATED ALWAYS AS (
    bathing_score + dressing_score + toileting_score + 
    transferring_score + continence_score + feeding_score
  ) STORED,
  
  -- Classificação baseada na pontuação
  independence_level text GENERATED ALWAYS AS (
    CASE 
      WHEN (bathing_score + dressing_score + toileting_score + transferring_score + continence_score + feeding_score) = 6 THEN 'Totalmente Independente'
      WHEN (bathing_score + dressing_score + toileting_score + transferring_score + continence_score + feeding_score) >= 4 THEN 'Moderadamente Independente'
      WHEN (bathing_score + dressing_score + toileting_score + transferring_score + continence_score + feeding_score) >= 2 THEN 'Moderadamente Dependente'
      ELSE 'Totalmente Dependente'
    END
  ) STORED,
  
  -- Observações detalhadas
  bathing_notes text,
  dressing_notes text,
  toileting_notes text,
  transferring_notes text,
  continence_notes text,
  feeding_notes text,
  general_observations text,
  
  -- Metadados
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de detalhes das atividades (para histórico e relatórios)
CREATE TABLE IF NOT EXISTS katz_activity_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id uuid REFERENCES katz_evaluations(id) ON DELETE CASCADE,
  activity_name text NOT NULL CHECK (activity_name IN ('Banho', 'Vestir-se', 'Uso do Banheiro', 'Transferência', 'Continência', 'Alimentação')),
  score integer NOT NULL CHECK (score IN (0, 1)),
  description text NOT NULL, -- Descrição detalhada da capacidade
  assistance_needed text, -- Tipo de assistência necessária
  recommendations text, -- Recomendações específicas
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE katz_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE katz_activity_details ENABLE ROW LEVEL SECURITY;

-- Políticas para katz_evaluations
CREATE POLICY "Authenticated users can read katz evaluations"
  ON katz_evaluations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create katz evaluations"
  ON katz_evaluations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update katz evaluations they created or admins can update all"
  ON katz_evaluations
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can delete katz evaluations they created or admins can delete all"
  ON katz_evaluations
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas para katz_activity_details
CREATE POLICY "Authenticated users can read katz activity details"
  ON katz_activity_details
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage katz activity details"
  ON katz_activity_details
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Triggers
CREATE TRIGGER katz_evaluations_updated_at
  BEFORE UPDATE ON katz_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_katz_evaluations_guest_id ON katz_evaluations(guest_id);
CREATE INDEX IF NOT EXISTS idx_katz_evaluations_date ON katz_evaluations(evaluation_date);
CREATE INDEX IF NOT EXISTS idx_katz_evaluations_total_score ON katz_evaluations(total_score);
CREATE INDEX IF NOT EXISTS idx_katz_activity_details_evaluation_id ON katz_activity_details(evaluation_id);

-- Constraint para evitar múltiplas avaliações no mesmo dia para o mesmo hóspede
ALTER TABLE katz_evaluations 
ADD CONSTRAINT unique_guest_evaluation_date 
UNIQUE (guest_id, evaluation_date);