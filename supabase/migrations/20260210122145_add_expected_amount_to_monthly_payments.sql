/*
  # Add Expected Amount to Monthly Payments

  1. Changes to monthly_payments
    - Add `expected_amount` (numeric) - Valor esperado de pagamento do mês
    - This allows tracking what should have been paid vs what was actually paid

  2. Notes
    - expected_amount represents the total monthly fee expected for that specific month
    - This includes all applicable charges: monthly fee, climatization, maintenance, etc.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'monthly_payments' AND column_name = 'expected_amount'
  ) THEN
    ALTER TABLE monthly_payments ADD COLUMN expected_amount numeric(10,2) DEFAULT 0;
  END IF;
END $$;