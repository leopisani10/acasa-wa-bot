/*
  # Tabela de Hóspedes

  1. Nova Tabela
    - `guests` - Informações completas dos hóspedes
      - Informações pessoais e identificação
      - Informações contratuais e status
      - Responsável financeiro
      - Taxas e acomodação
      - Saúde e vacinas

  2. Segurança
    - Enable RLS na tabela `guests`
    - Usuários autenticados podem ler e criar hóspedes
    - Apenas o próprio usuário ou admin pode editar/deletar
*/

-- Criar tabela de hóspedes
CREATE TABLE IF NOT EXISTS guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Informações Pessoais e Identificação
  full_name text NOT NULL,
  gender text NOT NULL CHECK (gender IN ('Masculino', 'Feminino')),
  birth_date date NOT NULL,
  cpf text UNIQUE NOT NULL,
  rg text NOT NULL,
  document_issuer text NOT NULL,
  photo text,
  has_curatorship boolean DEFAULT false,
  image_usage_authorized boolean DEFAULT false,
  
  -- Informações Contratuais e Status
  status text NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo')),
  admission_date date NOT NULL,
  exit_date date,
  exit_reason text CHECK (exit_reason IN ('Óbito', 'Outro')),
  has_new_contract boolean DEFAULT false,
  contract_expiry_date date NOT NULL,
  dependency_level text NOT NULL CHECK (dependency_level IN ('I', 'II', 'III')),
  legal_responsible_relationship text NOT NULL,
  legal_responsible_cpf text NOT NULL,
  
  -- Responsável Financeiro
  financial_responsible_name text NOT NULL,
  financial_responsible_rg text NOT NULL,
  financial_responsible_cpf text NOT NULL,
  financial_responsible_marital_status text NOT NULL CHECK (financial_responsible_marital_status IN ('Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável')),
  financial_responsible_phone text NOT NULL,
  financial_responsible_email text,
  financial_responsible_address text NOT NULL,
  financial_responsible_profession text,
  unit text NOT NULL CHECK (unit IN ('Botafogo', 'Tijuca')),
  
  -- Taxas
  climatization_fee boolean DEFAULT false,
  maintenance_fee boolean DEFAULT false,
  trousseau_fee boolean DEFAULT false,
  administrative_fee boolean DEFAULT false,
  
  -- Acomodação e Cuidados
  room_number text NOT NULL,
  diaper_contracted boolean DEFAULT false,
  daily_diaper_quantity integer DEFAULT 0,
  
  -- Plano de Saúde e Serviços
  health_plan text,
  has_physiotherapy boolean DEFAULT false,
  has_speech_therapy boolean DEFAULT false,
  pia text, -- URL do arquivo
  paisi text, -- URL do arquivo
  digitalized_contract text, -- URL do arquivo
  
  -- Vacinas
  vaccination_up_to_date boolean DEFAULT false,
  
  -- Metadados
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de vacinas dos hóspedes
CREATE TABLE IF NOT EXISTS guest_vaccines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id uuid REFERENCES guests(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('COVID-19', 'Influenza', 'Hepatite B', 'Pneumonia', 'Outras')),
  application_date date NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_vaccines ENABLE ROW LEVEL SECURITY;

-- Políticas para guests
CREATE POLICY "Authenticated users can read guests"
  ON guests
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create guests"
  ON guests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update guests they created or admins can update all"
  ON guests
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can delete guests they created or admins can delete all"
  ON guests
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas para guest_vaccines
CREATE POLICY "Authenticated users can read guest vaccines"
  ON guest_vaccines
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage guest vaccines"
  ON guest_vaccines
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Triggers
CREATE TRIGGER guests_updated_at
  BEFORE UPDATE ON guests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_guests_cpf ON guests(cpf);
CREATE INDEX IF NOT EXISTS idx_guests_status ON guests(status);
CREATE INDEX IF NOT EXISTS idx_guests_unit ON guests(unit);
CREATE INDEX IF NOT EXISTS idx_guests_contract_expiry ON guests(contract_expiry_date);
CREATE INDEX IF NOT EXISTS idx_guest_vaccines_guest_id ON guest_vaccines(guest_id);