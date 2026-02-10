/*
  # Add Payment Amount Tracking

  1. Changes to monthly_payments
    - Add `amount_paid` (numeric) - Valor realmente pago pelo hóspede
    - Add `amount_difference` (numeric) - Diferença entre esperado e pago (gerado automaticamente)
    - Add `payment_notes` (text) - Observações sobre pagamento parcial ou atraso
    - Add `has_difference` (boolean) - Flag rápida para filtrar pagamentos com diferença
  
  2. Changes to guest_financial_records
    - Add `outstanding_balance` (numeric) - Saldo devedor acumulado do hóspede

  3. Notes
    - amount_difference = expected_amount - amount_paid
    - Se amount_paid < expected_amount, há saldo devedor
    - outstanding_balance acumula todas as diferenças não pagas
    - payment_notes permite documentar acordos ou motivos de pagamento parcial
*/

-- Add payment tracking fields to monthly_payments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'monthly_payments' AND column_name = 'amount_paid'
  ) THEN
    ALTER TABLE monthly_payments ADD COLUMN amount_paid numeric(10,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'monthly_payments' AND column_name = 'amount_difference'
  ) THEN
    ALTER TABLE monthly_payments ADD COLUMN amount_difference numeric(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'monthly_payments' AND column_name = 'payment_notes'
  ) THEN
    ALTER TABLE monthly_payments ADD COLUMN payment_notes text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'monthly_payments' AND column_name = 'has_difference'
  ) THEN
    ALTER TABLE monthly_payments ADD COLUMN has_difference boolean DEFAULT false;
  END IF;
END $$;

-- Add outstanding balance to guest_financial_records
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guest_financial_records' AND column_name = 'outstanding_balance'
  ) THEN
    ALTER TABLE guest_financial_records ADD COLUMN outstanding_balance numeric(10,2) DEFAULT 0;
  END IF;
END $$;

-- Create index for filtering payments with differences
CREATE INDEX IF NOT EXISTS idx_monthly_payments_has_difference ON monthly_payments(has_difference) WHERE has_difference = true;

-- Create index for guests with outstanding balance
CREATE INDEX IF NOT EXISTS idx_guest_financial_outstanding_balance ON guest_financial_records(outstanding_balance) WHERE outstanding_balance > 0;