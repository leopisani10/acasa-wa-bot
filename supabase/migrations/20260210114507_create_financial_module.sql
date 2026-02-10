/*
  # Create Financial Module

  1. New Tables
    - `guest_financial_records`
      - `id` (uuid, primary key)
      - `guest_id` (uuid, foreign key to guests)
      - `monthly_fee` (numeric) - Valor da mensalidade
      - `monthly_due_day` (integer) - Dia do vencimento da mensalidade
      - `climatization_fee` (numeric) - Valor da climatização
      - `climatization_due_day` (integer) - Dia do vencimento da climatização
      - `maintenance_fee` (numeric) - Valor da manutenção
      - `maintenance_due_day` (integer) - Dia do vencimento da manutenção
      - `trousseau_fee` (numeric) - Valor do enxoval
      - `trousseau_due_day` (integer) - Dia do vencimento do enxoval
      - `thirteenth_salary_fee` (numeric) - Valor do décimo terceiro
      - `thirteenth_salary_due_day` (integer) - Dia do vencimento do décimo terceiro
      - `is_active` (boolean) - Se o registro está ativo
      - `inactivation_date` (date) - Data de inativação
      - `revenue_loss` (numeric) - Perda de receita ao inativar
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `financial_adjustments`
      - `id` (uuid, primary key)
      - `guest_id` (uuid, foreign key to guests)
      - `adjustment_date` (date) - Data do reajuste
      - `previous_monthly_fee` (numeric) - Valor anterior da mensalidade
      - `new_monthly_fee` (numeric) - Novo valor da mensalidade
      - `adjustment_percentage` (numeric) - Percentual de reajuste
      - `notes` (text) - Observações
      - `created_at` (timestamptz)
      - `created_by` (uuid, foreign key to profiles)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create guest_financial_records table
CREATE TABLE IF NOT EXISTS guest_financial_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id uuid REFERENCES guests(id) ON DELETE CASCADE NOT NULL UNIQUE,
  monthly_fee numeric(10,2) DEFAULT 0,
  monthly_due_day integer DEFAULT 10,
  climatization_fee numeric(10,2) DEFAULT 0,
  climatization_due_day integer DEFAULT 10,
  maintenance_fee numeric(10,2) DEFAULT 0,
  maintenance_due_day integer DEFAULT 10,
  trousseau_fee numeric(10,2) DEFAULT 0,
  trousseau_due_day integer DEFAULT 10,
  thirteenth_salary_fee numeric(10,2) DEFAULT 0,
  thirteenth_salary_due_day integer DEFAULT 10,
  is_active boolean DEFAULT true,
  inactivation_date date,
  revenue_loss numeric(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create financial_adjustments table
CREATE TABLE IF NOT EXISTS financial_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id uuid REFERENCES guests(id) ON DELETE CASCADE NOT NULL,
  adjustment_date date NOT NULL DEFAULT CURRENT_DATE,
  previous_monthly_fee numeric(10,2) NOT NULL,
  new_monthly_fee numeric(10,2) NOT NULL,
  adjustment_percentage numeric(5,2) NOT NULL,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id)
);

-- Enable RLS
ALTER TABLE guest_financial_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_adjustments ENABLE ROW LEVEL SECURITY;

-- Policies for guest_financial_records
CREATE POLICY "Authenticated users can view financial records"
  ON guest_financial_records FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert financial records"
  ON guest_financial_records FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update financial records"
  ON guest_financial_records FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete financial records"
  ON guest_financial_records FOR DELETE
  TO authenticated
  USING (true);

-- Policies for financial_adjustments
CREATE POLICY "Authenticated users can view adjustments"
  ON financial_adjustments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert adjustments"
  ON financial_adjustments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update adjustments"
  ON financial_adjustments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete adjustments"
  ON financial_adjustments FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_guest_financial_records_guest_id ON guest_financial_records(guest_id);
CREATE INDEX IF NOT EXISTS idx_guest_financial_records_is_active ON guest_financial_records(is_active);
CREATE INDEX IF NOT EXISTS idx_financial_adjustments_guest_id ON financial_adjustments(guest_id);
CREATE INDEX IF NOT EXISTS idx_financial_adjustments_date ON financial_adjustments(adjustment_date);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_guest_financial_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_guest_financial_records_updated_at_trigger ON guest_financial_records;
CREATE TRIGGER update_guest_financial_records_updated_at_trigger
  BEFORE UPDATE ON guest_financial_records
  FOR EACH ROW
  EXECUTE FUNCTION update_guest_financial_records_updated_at();