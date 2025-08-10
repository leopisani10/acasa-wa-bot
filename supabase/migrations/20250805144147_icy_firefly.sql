/*
  # Tabela de Controle de Agravos

  1. Novas Tabelas
    - `incident_reports` - Relatórios de intercorrências e agravos
    - `incident_actions` - Ações tomadas para cada incidente
    - `incident_notifications` - Notificações enviadas

  2. Segurança
    - Enable RLS em todas as tabelas
    - Usuários autenticados podem ler relatórios
    - Apenas criador ou admin pode editar/deletar
*/

-- Criar tabela principal de relatórios de incidentes
CREATE TABLE IF NOT EXISTS incident_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id uuid REFERENCES guests(id) ON DELETE CASCADE,
  
  -- Informações básicas do incidente
  incident_date timestamptz NOT NULL,
  incident_time time NOT NULL,
  location text NOT NULL, -- Local onde ocorreu
  incident_type text NOT NULL CHECK (incident_type IN ('Queda', 'Lesão por Pressão', 'Medicação Incorreta', 'Engasgo', 'Confusão Mental', 'Fuga', 'Agressão', 'Outro')),
  severity_level text NOT NULL CHECK (severity_level IN ('Leve', 'Moderado', 'Grave', 'Crítico')),
  
  -- Descrição detalhada
  description text NOT NULL,
  circumstances text, -- Circunstâncias que levaram ao incidente
  witnesses text, -- Testemunhas presentes
  
  -- Pessoas envolvidas
  reporter_name text NOT NULL, -- Quem reportou
  reporter_position text NOT NULL,
  staff_involved text, -- Equipe envolvida
  
  -- Ações imediatas
  immediate_actions text NOT NULL, -- Ações tomadas imediatamente
  medical_assistance boolean DEFAULT false, -- Se houve assistência médica
  medical_details text, -- Detalhes da assistência médica
  
  -- Lesões e consequências
  injuries_sustained text, -- Lesões causadas
  body_parts_affected text, -- Partes do corpo afetadas
  photos_taken boolean DEFAULT false, -- Se foram tiradas fotos
  photo_urls text, -- URLs das fotos (separadas por vírgula)
  
  -- Notificações
  family_notified boolean DEFAULT false, -- Família foi notificada
  family_notification_time timestamptz, -- Quando foi notificada
  doctor_notified boolean DEFAULT false, -- Médico foi notificado
  doctor_notification_time timestamptz,
  
  -- Análise e prevenção
  contributing_factors text, -- Fatores que contribuíram
  preventable boolean, -- Se era evitável
  prevention_recommendations text, -- Recomendações para prevenção
  
  -- Status e follow-up
  status text NOT NULL DEFAULT 'Aberto' CHECK (status IN ('Aberto', 'Em Investigação', 'Resolvido', 'Fechado')),
  follow_up_required boolean DEFAULT false,
  follow_up_date date,
  resolution_notes text,
  
  -- Metadados
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de ações tomadas
CREATE TABLE IF NOT EXISTS incident_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid REFERENCES incident_reports(id) ON DELETE CASCADE,
  action_date timestamptz NOT NULL,
  action_taken text NOT NULL,
  responsible_person text NOT NULL,
  action_type text NOT NULL CHECK (action_type IN ('Preventiva', 'Corretiva', 'Investigativa', 'Administrativa')),
  status text NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Em Andamento', 'Concluída')),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de notificações
CREATE TABLE IF NOT EXISTS incident_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid REFERENCES incident_reports(id) ON DELETE CASCADE,
  notification_type text NOT NULL CHECK (notification_type IN ('Família', 'Médico', 'Gerência', 'Direção', 'Autoridades')),
  recipient_name text NOT NULL,
  recipient_contact text, -- Telefone ou email
  notification_method text NOT NULL CHECK (notification_method IN ('Telefone', 'Email', 'WhatsApp', 'Presencial', 'Outro')),
  notification_time timestamptz NOT NULL,
  message_sent text,
  response_received text,
  notified_by text NOT NULL, -- Quem fez a notificação
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para incident_reports
CREATE POLICY "Authenticated users can read incident reports"
  ON incident_reports
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create incident reports"
  ON incident_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update incident reports they created or admins can update all"
  ON incident_reports
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can delete incident reports they created or admins can delete all"
  ON incident_reports
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas para tabelas relacionadas
CREATE POLICY "Authenticated users can manage incident actions"
  ON incident_actions FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage incident notifications"
  ON incident_notifications FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Triggers
CREATE TRIGGER incident_reports_updated_at
  BEFORE UPDATE ON incident_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_incident_reports_guest_id ON incident_reports(guest_id);
CREATE INDEX IF NOT EXISTS idx_incident_reports_date ON incident_reports(incident_date);
CREATE INDEX IF NOT EXISTS idx_incident_reports_type ON incident_reports(incident_type);
CREATE INDEX IF NOT EXISTS idx_incident_reports_severity ON incident_reports(severity_level);
CREATE INDEX IF NOT EXISTS idx_incident_reports_status ON incident_reports(status);
CREATE INDEX IF NOT EXISTS idx_incident_actions_incident_id ON incident_actions(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_notifications_incident_id ON incident_notifications(incident_id);