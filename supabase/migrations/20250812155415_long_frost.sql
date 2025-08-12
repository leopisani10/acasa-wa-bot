/*
  # Banco de Talentos - Esquema de Dados

  1. Novas Tabelas
    - `candidates`
      - `id` (uuid, primary key)
      - `full_name` (text, nome completo)
      - `email` (text, único)
      - `phone` (text, telefone)
      - `desired_position` (text, cargo desejado)
      - `experience_years` (integer, anos de experiência)
      - `curriculum_url` (text, URL do currículo)
      - `city` (text, cidade)
      - `state` (text, estado)
      - `availability` (text, disponibilidade)
      - `salary_expectation` (text, expectativa salarial)
      - `status` (text, status no pipeline)
      - `source` (text, origem do candidato)
      - `lgpd_consent` (boolean, consentimento LGPD)
      - `notes` (text, notas internas)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `candidate_activities`
      - `id` (uuid, primary key)
      - `candidate_id` (uuid, foreign key para candidates)
      - `type` (text, tipo de atividade)
      - `title` (text, título da atividade)
      - `description` (text, descrição)
      - `scheduled_at` (timestamp, data agendada)
      - `completed_at` (timestamp, data de conclusão)
      - `status` (text, status da atividade)
      - `created_by` (uuid, usuário que criou)
      - `created_at` (timestamp)

  2. Segurança
    - Habilitar RLS em ambas as tabelas
    - Políticas para usuários autenticados
    - Candidatos podem inserir próprios dados (formulário público)
    - Apenas admins podem gerenciar dados internos

  3. Índices
    - Índices para busca por email, telefone, status
    - Índices para performance nas consultas
*/

-- Tabela de candidatos
CREATE TABLE IF NOT EXISTS candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  desired_position text NOT NULL,
  experience_years integer DEFAULT 0,
  curriculum_url text,
  city text,
  state text DEFAULT 'RJ',
  availability text,
  salary_expectation text,
  status text DEFAULT 'Novo' CHECK (status IN ('Novo', 'Triagem', 'Entrevista Agendada', 'Entrevistado', 'Aprovado', 'Contratado', 'Rejeitado', 'Inativo')),
  source text DEFAULT 'Site/Formulário' CHECK (source IN ('Site/Formulário', 'Indicação', 'LinkedIn', 'WhatsApp', 'Email', 'Presencial', 'Outro')),
  lgpd_consent boolean DEFAULT false NOT NULL,
  notes text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de atividades/interações com candidatos
CREATE TABLE IF NOT EXISTS candidate_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('Ligação', 'Email', 'WhatsApp', 'Entrevista', 'Tarefa', 'Anotação')),
  title text NOT NULL,
  description text,
  scheduled_at timestamptz,
  completed_at timestamptz,
  status text DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Em Andamento', 'Concluída', 'Cancelada')),
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_activities ENABLE ROW LEVEL SECURITY;

-- Políticas para candidates
CREATE POLICY "Authenticated users can read candidates"
  ON candidates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert candidates (public form)"
  ON candidates
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update candidates"
  ON candidates
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete candidates"
  ON candidates
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Políticas para candidate_activities
CREATE POLICY "Authenticated users can read candidate activities"
  ON candidate_activities
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create candidate activities"
  ON candidate_activities
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update activities they created or admins can update all"
  ON candidate_activities
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can delete activities they created or admins can delete all"
  ON candidate_activities
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
CREATE INDEX IF NOT EXISTS idx_candidates_phone ON candidates(phone);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);
CREATE INDEX IF NOT EXISTS idx_candidates_position ON candidates(desired_position);
CREATE INDEX IF NOT EXISTS idx_candidates_city ON candidates(city);
CREATE INDEX IF NOT EXISTS idx_candidates_created_at ON candidates(created_at);

CREATE INDEX IF NOT EXISTS idx_candidate_activities_candidate_id ON candidate_activities(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_activities_type ON candidate_activities(type);
CREATE INDEX IF NOT EXISTS idx_candidate_activities_status ON candidate_activities(status);
CREATE INDEX IF NOT EXISTS idx_candidate_activities_scheduled ON candidate_activities(scheduled_at);

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_candidates_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER candidates_updated_at
  BEFORE UPDATE ON candidates
  FOR EACH ROW
  EXECUTE FUNCTION update_candidates_updated_at();