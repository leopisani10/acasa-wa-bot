/*
  # Add No-Adjustment Tracking to Financial Module

  1. Changes to `guest_financial_records`
    - Add `no_adjustment_applied` (boolean) - Indica se não houve reajuste no ano
    - Add `no_adjustment_reason` (text) - Motivo da não aplicação do reajuste
    - Add `no_adjustment_year` (integer) - Ano em que não foi aplicado o reajuste
    - Add `no_adjustment_date` (date) - Data de registro da não aplicação

  2. New Table
    - `no_adjustment_history`
      - `id` (uuid, primary key)
      - `guest_id` (uuid, foreign key to guests)
      - `year` (integer) - Ano do não reajuste
      - `reason` (text) - Motivo da não aplicação
      - `recorded_date` (date) - Data de registro
      - `recorded_by` (uuid, foreign key to profiles)
      - `created_at` (timestamptz)

  3. Security
    - Enable RLS on new table
    - Add policies for authenticated users

  4. Notes
    - Este recurso permite registrar quando um hóspede não recebe reajuste anual
    - Mantém histórico completo de todas as decisões de não reajuste
    - Útil para auditoria e controle financeiro
*/

-- Add columns to guest_financial_records
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guest_financial_records' AND column_name = 'no_adjustment_applied'
  ) THEN
    ALTER TABLE guest_financial_records ADD COLUMN no_adjustment_applied boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guest_financial_records' AND column_name = 'no_adjustment_reason'
  ) THEN
    ALTER TABLE guest_financial_records ADD COLUMN no_adjustment_reason text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guest_financial_records' AND column_name = 'no_adjustment_year'
  ) THEN
    ALTER TABLE guest_financial_records ADD COLUMN no_adjustment_year integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guest_financial_records' AND column_name = 'no_adjustment_date'
  ) THEN
    ALTER TABLE guest_financial_records ADD COLUMN no_adjustment_date date;
  END IF;
END $$;

-- Create no_adjustment_history table
CREATE TABLE IF NOT EXISTS no_adjustment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id uuid REFERENCES guests(id) ON DELETE CASCADE NOT NULL,
  year integer NOT NULL,
  reason text NOT NULL,
  recorded_date date DEFAULT CURRENT_DATE,
  recorded_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE no_adjustment_history ENABLE ROW LEVEL SECURITY;

-- Policies for no_adjustment_history
CREATE POLICY "Authenticated users can view no-adjustment history"
  ON no_adjustment_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert no-adjustment history"
  ON no_adjustment_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update no-adjustment history"
  ON no_adjustment_history FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete no-adjustment history"
  ON no_adjustment_history FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_no_adjustment_history_guest_id ON no_adjustment_history(guest_id);
CREATE INDEX IF NOT EXISTS idx_no_adjustment_history_year ON no_adjustment_history(year);
CREATE INDEX IF NOT EXISTS idx_no_adjustment_history_date ON no_adjustment_history(recorded_date);