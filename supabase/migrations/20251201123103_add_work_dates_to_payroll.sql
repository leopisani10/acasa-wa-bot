/*
  # Add Work Dates and Simplified Payment Support

  ## Overview
  Adds support for tracking work dates and simplified payment modes for different
  employment types (especially for contract workers/"curingas").

  ## Changes
  
  ### Payroll Records Table Updates
  - Add `work_dates` (jsonb) - Array of dates when employee worked (for contract workers)
  - Add `employment_type` (text) - Cache of employee type for faster queries
  - Add `simplified_payment` (boolean) - Flag for simplified payment calculation
  
  ## Purpose
  - Track specific work days for contract workers
  - Simplify payroll entry for non-CLT employees
  - Enable different payment calculations based on employment type
*/

-- Add new columns to payroll_records
DO $$
BEGIN
  -- Add work_dates column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payroll_records' AND column_name = 'work_dates'
  ) THEN
    ALTER TABLE payroll_records ADD COLUMN work_dates jsonb DEFAULT '[]'::jsonb;
  END IF;

  -- Add employment_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payroll_records' AND column_name = 'employment_type'
  ) THEN
    ALTER TABLE payroll_records ADD COLUMN employment_type text;
  END IF;

  -- Add simplified_payment column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payroll_records' AND column_name = 'simplified_payment'
  ) THEN
    ALTER TABLE payroll_records ADD COLUMN simplified_payment boolean DEFAULT false;
  END IF;
END $$;

-- Add index for employment_type queries
CREATE INDEX IF NOT EXISTS idx_payroll_employment_type ON payroll_records(employment_type);

-- Add comment for documentation
COMMENT ON COLUMN payroll_records.work_dates IS 'Array of ISO date strings representing days worked (used primarily for contract workers)';
COMMENT ON COLUMN payroll_records.employment_type IS 'Cached employment type from employee record (CLT, Contrato, Terceirizado, Estágio, Outro)';
COMMENT ON COLUMN payroll_records.simplified_payment IS 'Flag indicating if this uses simplified payment calculation (single value, no complex calculations)';
