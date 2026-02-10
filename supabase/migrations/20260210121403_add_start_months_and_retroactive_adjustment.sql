/*
  # Add Start Months and Retroactive Adjustment Fields

  1. Changes to guest_financial_records
    - Add start month fields to track when installments begin:
      - `climatization_start_month` (date) - Mês de início das parcelas de climatização
      - `maintenance_start_month` (date) - Mês de início das parcelas de manutenção
      - `trousseau_start_month` (date) - Mês de início das parcelas de enxoval
      - `thirteenth_salary_start_month` (date) - Mês de início das parcelas de décimo terceiro
    
    - Add annual adjustment tracking:
      - `adjusted_current_year` (boolean) - Se foi reajustado no ano corrente
      - `retroactive_amount` (numeric) - Valor retroativo de janeiro para cobrar em fevereiro
      - `adjustment_year` (integer) - Ano do último reajuste registrado

  2. Notes
    - Start month fields use date type to store year-month (YYYY-MM-01)
    - Retroactive amount will be added to monthly fee when calculating
    - Adjustment year helps track which year was the last adjustment
*/

-- Add start month fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guest_financial_records' AND column_name = 'climatization_start_month'
  ) THEN
    ALTER TABLE guest_financial_records ADD COLUMN climatization_start_month date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guest_financial_records' AND column_name = 'maintenance_start_month'
  ) THEN
    ALTER TABLE guest_financial_records ADD COLUMN maintenance_start_month date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guest_financial_records' AND column_name = 'trousseau_start_month'
  ) THEN
    ALTER TABLE guest_financial_records ADD COLUMN trousseau_start_month date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guest_financial_records' AND column_name = 'thirteenth_salary_start_month'
  ) THEN
    ALTER TABLE guest_financial_records ADD COLUMN thirteenth_salary_start_month date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guest_financial_records' AND column_name = 'adjusted_current_year'
  ) THEN
    ALTER TABLE guest_financial_records ADD COLUMN adjusted_current_year boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guest_financial_records' AND column_name = 'retroactive_amount'
  ) THEN
    ALTER TABLE guest_financial_records ADD COLUMN retroactive_amount numeric(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guest_financial_records' AND column_name = 'adjustment_year'
  ) THEN
    ALTER TABLE guest_financial_records ADD COLUMN adjustment_year integer;
  END IF;
END $$;

-- Create index for adjustment year queries
CREATE INDEX IF NOT EXISTS idx_guest_financial_records_adjustment_year ON guest_financial_records(adjustment_year);