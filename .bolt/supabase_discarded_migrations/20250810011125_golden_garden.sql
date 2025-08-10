/*
  # Create CRM Module Tables

  1. New Tables
    - `units` - Unidades/filiais da ACASA
    - `contacts` - Contatos/familiares interessados
    - `leads` - Leads comerciais com pipeline
    - `activities` - Atividades/tarefas do lead
    - `wa_messages` - Mensagens WhatsApp (preparação para Etapa 2)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Admin users can manage all records
    - Staff users can read and manage assigned leads

  3. Indexes
    - Performance indexes for common queries
    - Lead stage and contact phone indexes
*/

-- Units table (existing units from current system)
CREATE TABLE IF NOT EXISTS units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Insert default units
INSERT INTO units (name) VALUES ('Botafogo'), ('Tijuca') 
ON CONFLICT DO NOTHING;

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid REFERENCES units(id),
  full_name text,
  relation text,                   -- filho, neto, etc.
  phone text UNIQUE,
  email text,
  neighborhood text,
  notes text,
  lgpd_consent boolean DEFAULT false,
  lgpd_consent_at timestamptz,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  stage text NOT NULL DEFAULT 'Novo',     -- Novo, Qualificando, Agendou visita, Visitou, Proposta, Fechado, Perdido
  source text DEFAULT 'Manual/CRM',
  owner_id uuid REFERENCES users(id),     -- usuário responsável
  diagnosis text,
  dependency_grade text,                  -- I, II, III
  elderly_age integer,
  elderly_name text,
  value_band text,                        -- ex.: Quarto Duplo
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  type text,                              -- call, visit, msg, task
  title text,
  description text,
  due_at timestamptz,
  done boolean DEFAULT false,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- WhatsApp messages table (reserved for Stage 2)
CREATE TABLE IF NOT EXISTS wa_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  wa_from text,
  wa_to text,
  direction text,                         -- inbound|outbound
  body text,
  wa_msg_id text UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_owner ON leads(owner_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone);
CREATE INDEX IF NOT EXISTS idx_activities_lead_id ON activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_activities_due_at ON activities(due_at);
CREATE INDEX IF NOT EXISTS idx_wa_messages_lead_created ON wa_messages(lead_id, created_at DESC);

-- Enable RLS
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for units
CREATE POLICY "Everyone can read units"
  ON units FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for contacts
CREATE POLICY "Users can read all contacts"
  ON contacts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create contacts"
  ON contacts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update contacts they created or admins can update all"
  ON contacts FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = created_by OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can delete contacts they created or admins can delete all"
  ON contacts FOR DELETE
  TO authenticated
  USING (
    auth.uid() = created_by OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- RLS Policies for leads
CREATE POLICY "Users can read all leads"
  ON leads FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create leads"
  ON leads FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update leads they created or own, or admins can update all"
  ON leads FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = created_by OR 
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can delete leads they created or admins can delete all"
  ON leads FOR DELETE
  TO authenticated
  USING (
    auth.uid() = created_by OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- RLS Policies for activities
CREATE POLICY "Users can read activities for leads they can access"
  ON activities FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM leads 
      WHERE leads.id = activities.lead_id AND (
        auth.uid() = leads.created_by OR 
        auth.uid() = leads.owner_id OR
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      )
    )
  );

CREATE POLICY "Users can create activities"
  ON activities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update activities they created"
  ON activities FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete activities they created"
  ON activities FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- RLS Policies for wa_messages
CREATE POLICY "Users can read wa_messages for leads they can access"
  ON wa_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM leads 
      WHERE leads.id = wa_messages.lead_id AND (
        auth.uid() = leads.created_by OR 
        auth.uid() = leads.owner_id OR
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      )
    )
  );

-- Add constraints
ALTER TABLE leads ADD CONSTRAINT leads_stage_check 
  CHECK (stage IN ('Novo', 'Qualificando', 'Agendou visita', 'Visitou', 'Proposta', 'Fechado', 'Perdido'));

ALTER TABLE leads ADD CONSTRAINT leads_dependency_grade_check 
  CHECK (dependency_grade IN ('I', 'II', 'III'));

ALTER TABLE activities ADD CONSTRAINT activities_type_check 
  CHECK (type IN ('call', 'visit', 'msg', 'task'));

ALTER TABLE wa_messages ADD CONSTRAINT wa_messages_direction_check 
  CHECK (direction IN ('inbound', 'outbound'));

-- Update triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER activities_updated_at
  BEFORE UPDATE ON activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();