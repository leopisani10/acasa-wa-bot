/*
  # Tabela de Documentos e Modelos

  1. Novas Tabelas
    - `document_templates` - Modelos de documentos
    - `document_revisions` - Histórico de revisões

  2. Segurança
    - Enable RLS em todas as tabelas
    - Usuários autenticados podem ler documentos
    - Apenas criador ou admin pode editar/deletar
*/

-- Criar tabela de modelos de documentos
CREATE TABLE IF NOT EXISTS document_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('Contrato', 'Formulário', 'Política', 'Procedimento', 'Manual', 'Outro')),
  name text NOT NULL,
  description text NOT NULL,
  file_type text NOT NULL CHECK (file_type IN ('PDF', 'DOC', 'DOCX', 'XLS', 'XLSX', 'PPT', 'PPTX', 'TXT', 'Outro')),
  attachment text, -- URL do arquivo
  last_revision_date date NOT NULL,
  last_revision_responsible text NOT NULL,
  status text NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo', 'Em Revisão', 'Aguardando Aprovação')),
  revision_periodicity text NOT NULL CHECK (revision_periodicity IN ('Mensal', 'Trimestral', 'Semestral', 'Anual', 'Bianual', 'Conforme Necessário')),
  internal_notes text,
  
  -- Metadados
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de revisões
CREATE TABLE IF NOT EXISTS document_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES document_templates(id) ON DELETE CASCADE,
  revision_date date NOT NULL,
  responsible text NOT NULL,
  changes text NOT NULL,
  version text NOT NULL,
  previous_attachment text, -- URL do arquivo anterior
  new_attachment text, -- URL do novo arquivo
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_revisions ENABLE ROW LEVEL SECURITY;

-- Políticas para document_templates
CREATE POLICY "Authenticated users can read document templates"
  ON document_templates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create document templates"
  ON document_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update documents they created or admins can update all"
  ON document_templates
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can delete documents they created or admins can delete all"
  ON document_templates
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas para document_revisions
CREATE POLICY "Authenticated users can read document revisions"
  ON document_revisions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create document revisions"
  ON document_revisions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Triggers
CREATE TRIGGER document_templates_updated_at
  BEFORE UPDATE ON document_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_document_templates_category ON document_templates(category);
CREATE INDEX IF NOT EXISTS idx_document_templates_status ON document_templates(status);
CREATE INDEX IF NOT EXISTS idx_document_templates_revision_date ON document_templates(last_revision_date);
CREATE INDEX IF NOT EXISTS idx_document_revisions_document_id ON document_revisions(document_id);