/*
  # Sistema de Certificados com Histórico

  1. Novas Tabelas
    - `certificates` - Certificados principais (dedetização, limpeza de caixa d'água, etc)
      - `id` (uuid, PK)
      - `service` (tipo de serviço)
      - `unit` (unidade)
      - `executed_date` (data de execução)
      - `expiry_date` (data de vencimento)
      - `current_certificate` (URL do certificado atual)
      - `responsible` (responsável)
      - `observations` (observações)
      - timestamps

    - `certificate_history` - Histórico de todas as versões dos certificados
      - `id` (uuid, PK)
      - `certificate_id` (FK para certificates)
      - `executed_date` (data de execução da versão)
      - `expiry_date` (data de vencimento da versão)
      - `certificate_url` (URL do certificado arquivado)
      - `responsible` (responsável pela versão)
      - `observations` (observações da versão)
      - `replaced_at` (quando foi substituído)
      - `replaced_by` (quem substituiu)

  2. Segurança
    - Enable RLS em ambas tabelas
    - Políticas para leitura/escrita por usuários autenticados
    
  3. Automação
    - Trigger para arquivar automaticamente a versão antiga quando atualizar
*/

-- Criar tabela de certificados principais
CREATE TABLE IF NOT EXISTS certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service text NOT NULL CHECK (service IN (
    'Dedetização',
    'Limpeza de Caixa d''Água',
    'Manutenção de Elevador',
    'Laudo Elétrico',
    'AVCB',
    'Alvará Sanitário',
    'Laudo de Segurança',
    'Outro'
  )),
  unit text NOT NULL CHECK (unit IN ('Botafogo', 'Tijuca')),
  executed_date date NOT NULL,
  expiry_date date NOT NULL,
  current_certificate text,
  responsible text NOT NULL,
  observations text,
  last_update timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de histórico de certificados
CREATE TABLE IF NOT EXISTS certificate_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id uuid REFERENCES certificates(id) ON DELETE CASCADE,
  executed_date date NOT NULL,
  expiry_date date NOT NULL,
  certificate_url text,
  responsible text NOT NULL,
  observations text,
  replaced_at timestamptz DEFAULT now(),
  replaced_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_history ENABLE ROW LEVEL SECURITY;

-- Políticas para certificates
CREATE POLICY "Authenticated users can read certificates"
  ON certificates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create certificates"
  ON certificates
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update certificates"
  ON certificates
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete certificates"
  ON certificates
  FOR DELETE
  TO authenticated
  USING (true);

-- Políticas para certificate_history
CREATE POLICY "Authenticated users can read certificate history"
  ON certificate_history
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create certificate history"
  ON certificate_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = replaced_by);

-- Trigger para atualizar last_update
CREATE OR REPLACE FUNCTION update_certificate_last_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_update = now();
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER certificate_last_update
  BEFORE UPDATE ON certificates
  FOR EACH ROW
  EXECUTE FUNCTION update_certificate_last_update();

-- Função para arquivar versão antiga ao atualizar certificado
CREATE OR REPLACE FUNCTION archive_certificate_on_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Se a data de execução ou certificado mudou, arquiva a versão antiga
  IF (OLD.executed_date != NEW.executed_date OR 
      OLD.current_certificate != NEW.current_certificate OR
      OLD.expiry_date != NEW.expiry_date) AND 
     OLD.current_certificate IS NOT NULL AND 
     OLD.current_certificate != '' THEN
    
    INSERT INTO certificate_history (
      certificate_id,
      executed_date,
      expiry_date,
      certificate_url,
      responsible,
      observations,
      replaced_by
    ) VALUES (
      OLD.id,
      OLD.executed_date,
      OLD.expiry_date,
      OLD.current_certificate,
      OLD.responsible,
      OLD.observations,
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER archive_certificate
  BEFORE UPDATE ON certificates
  FOR EACH ROW
  EXECUTE FUNCTION archive_certificate_on_update();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_certificates_service ON certificates(service);
CREATE INDEX IF NOT EXISTS idx_certificates_unit ON certificates(unit);
CREATE INDEX IF NOT EXISTS idx_certificates_expiry_date ON certificates(expiry_date);
CREATE INDEX IF NOT EXISTS idx_certificate_history_certificate_id ON certificate_history(certificate_id);
CREATE INDEX IF NOT EXISTS idx_certificate_history_replaced_at ON certificate_history(replaced_at);

-- Constraint único para evitar duplicatas (um certificado por serviço e unidade)
ALTER TABLE certificates 
ADD CONSTRAINT unique_service_unit 
UNIQUE (service, unit);