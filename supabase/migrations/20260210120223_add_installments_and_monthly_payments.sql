/*
  # Add Installments and Monthly Payment Tracking

  1. Changes to guest_financial_records
    - Add installment fields (1, 2 or 3) for:
      - `climatization_installments` - Número de parcelas da climatização
      - `maintenance_installments` - Número de parcelas da manutenção
      - `trousseau_installments` - Número de parcelas do enxoval
      - `thirteenth_salary_installments` - Número de parcelas do décimo terceiro

  2. New Tables
    - `monthly_payments`
      - `id` (uuid, primary key)
      - `guest_id` (uuid, foreign key to guests)
      - `payment_month` (date) - Mês de referência do pagamento
      - `monthly_fee_paid` (boolean) - Se a mensalidade foi paga
      - `payment_date` (date) - Data do pagamento
      - `notes` (text) - Observações
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  3. Security
    - Enable RLS on monthly_payments table
    - Add policies for authenticated users
*/

-- Add installment fields to guest_financial_records
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guest_financial_records' AND column_name = 'climatization_installments'
  ) THEN
    ALTER TABLE guest_financial_records ADD COLUMN climatization_installments integer DEFAULT 1 CHECK (climatization_installments >= 1 AND climatization_installments <= 3);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guest_financial_records' AND column_name = 'maintenance_installments'
  ) THEN
    ALTER TABLE guest_financial_records ADD COLUMN maintenance_installments integer DEFAULT 1 CHECK (maintenance_installments >= 1 AND maintenance_installments <= 3);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guest_financial_records' AND column_name = 'trousseau_installments'
  ) THEN
    ALTER TABLE guest_financial_records ADD COLUMN trousseau_installments integer DEFAULT 1 CHECK (trousseau_installments >= 1 AND trousseau_installments <= 3);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guest_financial_records' AND column_name = 'thirteenth_salary_installments'
  ) THEN
    ALTER TABLE guest_financial_records ADD COLUMN thirteenth_salary_installments integer DEFAULT 1 CHECK (thirteenth_salary_installments >= 1 AND thirteenth_salary_installments <= 3);
  END IF;
END $$;

-- Create monthly_payments table
CREATE TABLE IF NOT EXISTS monthly_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id uuid REFERENCES guests(id) ON DELETE CASCADE NOT NULL,
  payment_month date NOT NULL,
  monthly_fee_paid boolean DEFAULT false,
  payment_date date,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(guest_id, payment_month)
);

-- Enable RLS
ALTER TABLE monthly_payments ENABLE ROW LEVEL SECURITY;

-- Policies for monthly_payments
CREATE POLICY "Authenticated users can view monthly payments"
  ON monthly_payments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert monthly payments"
  ON monthly_payments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update monthly payments"
  ON monthly_payments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete monthly payments"
  ON monthly_payments FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_monthly_payments_guest_id ON monthly_payments(guest_id);
CREATE INDEX IF NOT EXISTS idx_monthly_payments_month ON monthly_payments(payment_month);
CREATE INDEX IF NOT EXISTS idx_monthly_payments_paid ON monthly_payments(monthly_fee_paid);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_monthly_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_monthly_payments_updated_at_trigger ON monthly_payments;
CREATE TRIGGER update_monthly_payments_updated_at_trigger
  BEFORE UPDATE ON monthly_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_monthly_payments_updated_at();