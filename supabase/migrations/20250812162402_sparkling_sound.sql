/*
  # Create Talent Bank Tables

  1. New Tables
    - `candidates`
      - `id` (uuid, primary key)
      - `full_name` (text, required)
      - `email` (text, unique, required)
      - `phone` (text, required)
      - `cpf` (text, unique)
      - `birth_date` (date)
      - `address` (text)
      - `city` (text, required)
      - `state` (text, required)
      - `desired_position` (text, required)
      - `experience_years` (integer)
      - `education_level` (text)
      - `skills` (text)
      - `availability` (text, required)
      - `salary_expectation` (text)
      - `portfolio_url` (text)
      - `linkedin_url` (text)
      - `status` (text, default 'Novo')
      - `source` (text, default 'Manual/CRM')
      - `notes` (text)
      - `lgpd_consent` (boolean, default false)
      - `lgpd_consent_at` (timestamp)
      - `created_by` (uuid, foreign key to users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `candidate_activities`
      - `id` (uuid, primary key)
      - `candidate_id` (uuid, foreign key to candidates)
      - `type` (text, required)
      - `title` (text, required)
      - `description` (text)
      - `status` (text, default 'Pendente')
      - `due_date` (timestamp)
      - `completed_at` (timestamp)
      - `created_by` (uuid, foreign key to users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage records
    - Service role has full access

  3. Indexes
    - Performance indexes on commonly queried fields
    - Unique constraints where appropriate
</*/

-- Create candidates table
CREATE TABLE IF NOT EXISTS candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  cpf text UNIQUE,
  birth_date date,
  address text,
  city text NOT NULL,
  state text NOT NULL DEFAULT 'RJ',
  desired_position text NOT NULL,
  experience_years integer DEFAULT 0,
  education_level text,
  skills text,
  availability text NOT NULL,
  salary_expectation text,
  portfolio_url text,
  linkedin_url text,
  status text NOT NULL DEFAULT 'Novo',
  source text NOT NULL DEFAULT 'Manual/CRM',
  notes text,
  lgpd_consent boolean DEFAULT false,
  lgpd_consent_at timestamptz,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create candidate_activities table
CREATE TABLE IF NOT EXISTS candidate_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'Pendente',
  due_date timestamptz,
  completed_at timestamptz,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add constraints
ALTER TABLE candidates 
ADD CONSTRAINT IF NOT EXISTS candidates_status_check 
CHECK (status = ANY (ARRAY['Novo'::text, 'Triagem'::text, 'Entrevista Agendada'::text, 'Entrevistado'::text, 'Aprovado'::text, 'Contratado'::text, 'Rejeitado'::text, 'Inativo'::text]));

ALTER TABLE candidates 
ADD CONSTRAINT IF NOT EXISTS candidates_source_check 
CHECK (source = ANY (ARRAY['Manual/CRM'::text, 'Site/Formulário'::text, 'LinkedIn'::text, 'Indicação'::text, 'Indeed'::text, 'Catho'::text, 'Vagas.com'::text, 'Outro'::text]));

ALTER TABLE candidates 
ADD CONSTRAINT IF NOT EXISTS candidates_availability_check 
CHECK (availability = ANY (ARRAY['Imediato'::text, '15 dias'::text, '30 dias'::text, '60 dias'::text, 'A combinar'::text]));

ALTER TABLE candidates 
ADD CONSTRAINT IF NOT EXISTS candidates_education_level_check 
CHECK (education_level = ANY (ARRAY['Fundamental'::text, 'Médio'::text, 'Técnico'::text, 'Superior Incompleto'::text, 'Superior Completo'::text, 'Pós-graduação'::text, 'Mestrado'::text, 'Doutorado'::text]));

ALTER TABLE candidate_activities 
ADD CONSTRAINT IF NOT EXISTS candidate_activities_type_check 
CHECK (type = ANY (ARRAY['Ligação'::text, 'Email'::text, 'WhatsApp'::text, 'Entrevista'::text, 'Teste'::text, 'Anotação'::text, 'Follow-up'::text]));

ALTER TABLE candidate_activities 
ADD CONSTRAINT IF NOT EXISTS candidate_activities_status_check 
CHECK (status = ANY (ARRAY['Pendente'::text, 'Em Andamento'::text, 'Concluída'::text, 'Cancelada'::text]));

-- Add foreign key constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'candidates_created_by_fkey'
  ) THEN
    ALTER TABLE candidates 
    ADD CONSTRAINT candidates_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES auth.users(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'candidate_activities_candidate_id_fkey'
  ) THEN
    ALTER TABLE candidate_activities 
    ADD CONSTRAINT candidate_activities_candidate_id_fkey 
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'candidate_activities_created_by_fkey'
  ) THEN
    ALTER TABLE candidate_activities 
    ADD CONSTRAINT candidate_activities_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES auth.users(id);
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
CREATE INDEX IF NOT EXISTS idx_candidates_cpf ON candidates(cpf);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);
CREATE INDEX IF NOT EXISTS idx_candidates_desired_position ON candidates(desired_position);
CREATE INDEX IF NOT EXISTS idx_candidates_city ON candidates(city);
CREATE INDEX IF NOT EXISTS idx_candidates_source ON candidates(source);
CREATE INDEX IF NOT EXISTS idx_candidates_created_at ON candidates(created_at);

CREATE INDEX IF NOT EXISTS idx_candidate_activities_candidate_id ON candidate_activities(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_activities_status ON candidate_activities(status);
CREATE INDEX IF NOT EXISTS idx_candidate_activities_type ON candidate_activities(type);
CREATE INDEX IF NOT EXISTS idx_candidate_activities_due_date ON candidate_activities(due_date);

-- Enable Row Level Security
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_activities ENABLE ROW LEVEL SECURITY;

-- Create policies for candidates table
CREATE POLICY "Service role full access to candidates"
  ON candidates
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read all candidates"
  ON candidates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create candidates"
  ON candidates
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update candidates they created or admins can update all"
  ON candidates
  FOR UPDATE
  TO authenticated
  USING (
    (auth.uid() = created_by) OR 
    (EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ))
  );

CREATE POLICY "Users can delete candidates they created or admins can delete all"
  ON candidates
  FOR DELETE
  TO authenticated
  USING (
    (auth.uid() = created_by) OR 
    (EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ))
  );

-- Create policies for candidate_activities table
CREATE POLICY "Service role full access to candidate activities"
  ON candidate_activities
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read all candidate activities"
  ON candidate_activities
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create candidate activities"
  ON candidate_activities
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update candidate activities they created or admins can update all"
  ON candidate_activities
  FOR UPDATE
  TO authenticated
  USING (
    (auth.uid() = created_by) OR 
    (EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ))
  );

CREATE POLICY "Users can delete candidate activities they created or admins can delete all"
  ON candidate_activities
  FOR DELETE
  TO authenticated
  USING (
    (auth.uid() = created_by) OR 
    (EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ))
  );

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS candidates_updated_at ON candidates;
CREATE TRIGGER candidates_updated_at
  BEFORE UPDATE ON candidates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS candidate_activities_updated_at ON candidate_activities;
CREATE TRIGGER candidate_activities_updated_at
  BEFORE UPDATE ON candidate_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();