/*
  # Módulo CRM - Tabelas e Configurações Completas

  1. Tabelas Criadas
    - `units` - Unidades para atribuição de leads
    - `contacts` - Contatos e responsáveis pelos leads
    - `leads` - Leads comerciais com pipeline
    - `activities` - Atividades e tarefas vinculadas aos leads
    - `wa_messages` - Mensagens WhatsApp (preparação para Etapa 2)

  2. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas para usuários autenticados
    - Foreign keys configuradas corretamente

  3. Performance
    - Índices criados para consultas otimizadas
    - Schema cache do PostgREST atualizado

  4. Permissões
    - Acesso concedido para anon e authenticated
    - Foreign key com profiles configurada
*/

-- Criar tabelas do CRM no schema public
CREATE TABLE IF NOT EXISTS public.units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid REFERENCES public.units(id),
  full_name text,
  relation text,                   -- filho, neto etc.
  phone text UNIQUE,
  email text,
  neighborhood text,
  notes text,
  lgpd_consent boolean DEFAULT false,
  lgpd_consent_at timestamptz,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES public.contacts(id) ON DELETE CASCADE,
  stage text NOT NULL DEFAULT 'Novo',     -- Novo, Qualificando, Agendou visita, Visitou, Proposta, Fechado, Perdido
  source text DEFAULT 'Manual/CRM',
  owner_id uuid,                          -- será referenciado para profiles depois
  diagnosis text,
  dependency_grade text,                  -- I, II, III
  elderly_age int,
  elderly_name text,
  value_band text,                        -- ex.: Quarto Duplo
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  type text,                              -- call, visit, msg, task
  title text,
  description text,
  due_at timestamptz,
  done boolean DEFAULT false,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela preparada para Etapa 2 (WhatsApp)
CREATE TABLE IF NOT EXISTS public.wa_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  wa_from text,
  wa_to text,
  direction text,                         -- inbound|outbound
  body text,
  wa_msg_id text UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Adicionar foreign key para profiles se a tabela existir
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
    -- Adicionar foreign key se não existir
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'leads_owner_id_fkey' 
      AND table_name = 'leads'
    ) THEN
      ALTER TABLE public.leads 
      ADD CONSTRAINT leads_owner_id_fkey 
      FOREIGN KEY (owner_id) REFERENCES public.profiles(id);
    END IF;
    
    -- Adicionar foreign keys para created_by se não existirem
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'contacts_created_by_fkey' 
      AND table_name = 'contacts'
    ) THEN
      ALTER TABLE public.contacts 
      ADD CONSTRAINT contacts_created_by_fkey 
      FOREIGN KEY (created_by) REFERENCES public.profiles(id);
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'leads_created_by_fkey' 
      AND table_name = 'leads'
    ) THEN
      ALTER TABLE public.leads 
      ADD CONSTRAINT leads_created_by_fkey 
      FOREIGN KEY (created_by) REFERENCES public.profiles(id);
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'activities_created_by_fkey' 
      AND table_name = 'activities'
    ) THEN
      ALTER TABLE public.activities 
      ADD CONSTRAINT activities_created_by_fkey 
      FOREIGN KEY (created_by) REFERENCES public.profiles(id);
    END IF;
  END IF;
END $$;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_leads_stage ON public.leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_contact_id ON public.leads(contact_id);
CREATE INDEX IF NOT EXISTS idx_leads_owner_id ON public.leads(owner_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON public.contacts(phone);
CREATE INDEX IF NOT EXISTS idx_contacts_unit_id ON public.contacts(unit_id);
CREATE INDEX IF NOT EXISTS idx_activities_lead_id ON public.activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_activities_due_at ON public.activities(due_at);
CREATE INDEX IF NOT EXISTS idx_wa_messages_lead_created ON public.wa_messages(lead_id, created_at DESC);

-- Adicionar constraints de validação
ALTER TABLE public.leads 
ADD CONSTRAINT IF NOT EXISTS leads_stage_check 
CHECK (stage IN ('Novo', 'Qualificando', 'Agendou visita', 'Visitou', 'Proposta', 'Fechado', 'Perdido'));

ALTER TABLE public.leads 
ADD CONSTRAINT IF NOT EXISTS leads_dependency_grade_check 
CHECK (dependency_grade IN ('I', 'II', 'III') OR dependency_grade IS NULL);

ALTER TABLE public.activities 
ADD CONSTRAINT IF NOT EXISTS activities_type_check 
CHECK (type IN ('call', 'visit', 'msg', 'task') OR type IS NULL);

ALTER TABLE public.wa_messages 
ADD CONSTRAINT IF NOT EXISTS wa_messages_direction_check 
CHECK (direction IN ('inbound', 'outbound') OR direction IS NULL);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wa_messages ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para units
CREATE POLICY IF NOT EXISTS "Authenticated users can read units"
  ON public.units
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can create units"
  ON public.units
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can update units"
  ON public.units
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Políticas RLS para contacts
CREATE POLICY IF NOT EXISTS "Authenticated users can read contacts"
  ON public.contacts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can create contacts"
  ON public.contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can update contacts"
  ON public.contacts
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can delete contacts"
  ON public.contacts
  FOR DELETE
  TO authenticated
  USING (true);

-- Políticas RLS para leads
CREATE POLICY IF NOT EXISTS "Authenticated users can read leads"
  ON public.leads
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can create leads"
  ON public.leads
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can update leads"
  ON public.leads
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can delete leads"
  ON public.leads
  FOR DELETE
  TO authenticated
  USING (true);

-- Políticas RLS para activities
CREATE POLICY IF NOT EXISTS "Authenticated users can read activities"
  ON public.activities
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can create activities"
  ON public.activities
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can update activities"
  ON public.activities
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can delete activities"
  ON public.activities
  FOR DELETE
  TO authenticated
  USING (true);

-- Políticas RLS para wa_messages (Etapa 2)
CREATE POLICY IF NOT EXISTS "Authenticated users can read wa_messages"
  ON public.wa_messages
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can create wa_messages"
  ON public.wa_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Inserir dados iniciais das unidades
INSERT INTO public.units (name) VALUES 
  ('Botafogo'),
  ('Tijuca')
ON CONFLICT DO NOTHING;

-- Conceder permissões para roles anon e authenticated
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Configurar privilégios padrão para futuras tabelas
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated;

-- Forçar refresh do cache do PostgREST
NOTIFY pgrst, 'reload schema';