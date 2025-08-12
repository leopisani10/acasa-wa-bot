/*
  # Add exit fields to employees table

  1. New Columns
    - `exit_date` (date, nullable) - Data de saída quando status for Inativo
    - `exit_reason` (text, nullable) - Motivo da saída com valores controlados

  2. Security
    - Mantém RLS existente
    - Adiciona constraint para validar motivos de saída
*/

-- Add exit date column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'exit_date'
  ) THEN
    ALTER TABLE employees ADD COLUMN exit_date date;
  END IF;
END $$;

-- Add exit reason column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'exit_reason'
  ) THEN
    ALTER TABLE employees ADD COLUMN exit_reason text;
  END IF;
END $$;

-- Add constraint for exit reason values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'employees' AND constraint_name = 'employees_exit_reason_check'
  ) THEN
    ALTER TABLE employees ADD CONSTRAINT employees_exit_reason_check 
    CHECK (exit_reason = ANY (ARRAY['Rescisão'::text, 'Demissão'::text, 'Pedido de Demissão'::text]));
  END IF;
END $$;

-- Add index for exit date queries
CREATE INDEX IF NOT EXISTS idx_employees_exit_date ON employees(exit_date);