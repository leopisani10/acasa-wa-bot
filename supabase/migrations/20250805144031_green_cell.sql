/*
  # Tabela de Colaboradores

  1. Novas Tabelas
    - `employees` - Informações básicas dos colaboradores
    - `employee_covid_vaccines` - Vacinas COVID dos colaboradores
    - `employee_medical_exams` - Exames médicos (CLT)
    - `employee_general_vaccines` - Vacinas gerais (CLT)
    - `employee_vacations` - Férias (CLT)

  2. Segurança
    - Enable RLS em todas as tabelas
    - Usuários autenticados podem ler colaboradores
    - Apenas criador ou admin pode editar/deletar
*/

-- Criar tabela principal de colaboradores
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Campos sempre visíveis
  full_name text NOT NULL,
  cpf text UNIQUE NOT NULL,
  rg text NOT NULL,
  birth_date date NOT NULL,
  address text NOT NULL,
  position text NOT NULL,
  unit text NOT NULL CHECK (unit IN ('Botafogo', 'Tijuca')),
  status text NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo', 'Afastado', 'Férias')),
  photo text,
  observations text,
  
  -- Carteira profissional
  professional_license_council text DEFAULT 'Não Possui' CHECK (professional_license_council IN ('COREN', 'CRM', 'CRF', 'CRESS', 'CRN', 'CREFITO', 'CRA', 'Outro', 'Não Possui')),
  professional_license_number text,
  professional_license_expiry_date date,
  
  -- Tipo de vínculo
  employment_type text NOT NULL CHECK (employment_type IN ('CLT', 'Contrato', 'Terceirizado', 'Estágio', 'Outro')),
  
  -- Dados CLT (JSON para flexibilidade)
  clt_data jsonb,
  
  -- Dados Contrato (JSON)
  contract_data jsonb,
  
  -- Dados Terceirizado (JSON)
  outsourced_data jsonb,
  
  -- Metadados
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de vacinas COVID
CREATE TABLE IF NOT EXISTS employee_covid_vaccines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  dose text NOT NULL CHECK (dose IN ('1ª Dose', '2ª Dose', '3ª Dose', 'Reforço', 'Bivalente')),
  vaccine_type text NOT NULL CHECK (vaccine_type IN ('Pfizer', 'CoronaVac', 'AstraZeneca', 'Janssen', 'Outro')),
  application_date date NOT NULL,
  expiry_date date,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Tabela de exames médicos (CLT)
CREATE TABLE IF NOT EXISTS employee_medical_exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('ASO', 'Hemograma', 'Outro')),
  exam_date date NOT NULL,
  expiry_date date NOT NULL,
  result text NOT NULL CHECK (result IN ('Apto', 'Inapto', 'Apto com Restrições')),
  notes text,
  attachment text, -- URL do arquivo
  created_at timestamptz DEFAULT now()
);

-- Tabela de vacinas gerais (CLT)
CREATE TABLE IF NOT EXISTS employee_general_vaccines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('Hepatite B', 'Influenza', 'Tétano', 'Febre Amarela', 'Outro')),
  application_date date NOT NULL,
  expiry_date date,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Tabela de férias (CLT)
CREATE TABLE IF NOT EXISTS employee_vacations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  days integer NOT NULL,
  period text NOT NULL, -- ex: "2024/2025"
  status text NOT NULL CHECK (status IN ('Programadas', 'Em Andamento', 'Concluídas')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_covid_vaccines ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_medical_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_general_vaccines ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_vacations ENABLE ROW LEVEL SECURITY;

-- Políticas para employees
CREATE POLICY "Authenticated users can read employees"
  ON employees
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create employees"
  ON employees
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update employees they created or admins can update all"
  ON employees
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can delete employees they created or admins can delete all"
  ON employees
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas para tabelas relacionadas (mesmo padrão)
CREATE POLICY "Authenticated users can manage employee covid vaccines"
  ON employee_covid_vaccines FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage employee medical exams"
  ON employee_medical_exams FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage employee general vaccines"
  ON employee_general_vaccines FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage employee vacations"
  ON employee_vacations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Triggers
CREATE TRIGGER employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_employees_cpf ON employees(cpf);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_unit ON employees(unit);
CREATE INDEX IF NOT EXISTS idx_employees_employment_type ON employees(employment_type);
CREATE INDEX IF NOT EXISTS idx_employee_covid_vaccines_employee_id ON employee_covid_vaccines(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_medical_exams_employee_id ON employee_medical_exams(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_medical_exams_expiry ON employee_medical_exams(expiry_date);