/*
  # Criar tabela de substituições da escala

  1. Nova Tabela
    - `schedule_substitutions`
      - `id` (uuid, primary key)
      - `schedule_id` (uuid, referência para work_schedules)
      - `employee_id` (uuid, colaborador original)
      - `schedule_type` (text, tipo da escala)
      - `unit` (text, unidade)
      - `month` (integer, mês)
      - `year` (integer, ano)
      - `day` (integer, dia do mês)
      - `substitute_id` (uuid, colaborador substituto)
      - `substitute_name` (text, nome do substituto)
      - `reason` (text, motivo da substituição)
      - `created_at` (timestamp)

  2. Segurança
    - Habilitar RLS na tabela `schedule_substitutions`
    - Adicionar políticas para usuários autenticados
*/

CREATE TABLE IF NOT EXISTS schedule_substitutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  schedule_type text NOT NULL,
  unit text NOT NULL,
  month integer NOT NULL,
  year integer NOT NULL,
  day integer NOT NULL,
  substitute_id text,
  substitute_name text NOT NULL,
  reason text NOT NULL DEFAULT 'Substituição',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE schedule_substitutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read schedule substitutions"
  ON schedule_substitutions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create schedule substitutions"
  ON schedule_substitutions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update schedule substitutions"
  ON schedule_substitutions
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete schedule substitutions"
  ON schedule_substitutions
  FOR DELETE
  TO authenticated
  USING (true);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_schedule_substitutions_employee_month ON schedule_substitutions USING btree (employee_id, schedule_type, unit, month, year);
CREATE INDEX IF NOT EXISTS idx_schedule_substitutions_day ON schedule_substitutions USING btree (day);

-- Constraints
ALTER TABLE schedule_substitutions ADD CONSTRAINT schedule_substitutions_month_check CHECK ((month >= 1) AND (month <= 12));
ALTER TABLE schedule_substitutions ADD CONSTRAINT schedule_substitutions_year_check CHECK ((year >= 2020) AND (year <= 2030));
ALTER TABLE schedule_substitutions ADD CONSTRAINT schedule_substitutions_day_check CHECK ((day >= 1) AND (day <= 31));
ALTER TABLE schedule_substitutions ADD CONSTRAINT schedule_substitutions_schedule_type_check CHECK ((schedule_type = ANY (ARRAY['Geral'::text, 'Enfermagem'::text, 'Nutrição'::text])));
ALTER TABLE schedule_substitutions ADD CONSTRAINT schedule_substitutions_unit_check CHECK ((unit = ANY (ARRAY['Botafogo'::text, 'Tijuca'::text])));

-- Unique constraint para evitar múltiplas substituições no mesmo dia
CREATE UNIQUE INDEX IF NOT EXISTS unique_substitution_per_day ON schedule_substitutions USING btree (employee_id, schedule_type, unit, month, year, day);