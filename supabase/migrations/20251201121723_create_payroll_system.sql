/*
  # Payroll System

  ## Overview
  Creates a comprehensive payroll management system for tracking employee salaries,
  deductions, benefits, and payment history with full audit trail.

  ## New Tables
  
  ### `payroll_records`
  Main payroll table tracking monthly salary calculations
  - `id` (uuid, primary key)
  - `employee_id` (uuid, foreign key to employees)
  - `reference_month` (text) - Format: "YYYY-MM"
  - `reference_year` (integer)
  - `base_salary` (numeric) - Base monthly salary
  - `overtime_hours` (numeric) - Extra hours worked
  - `overtime_amount` (numeric) - Payment for overtime
  - `night_shift_hours` (numeric) - Night shift hours
  - `night_shift_amount` (numeric) - Additional night shift payment
  - `hazard_pay` (numeric) - Insalubridade/periculosidade
  - `food_allowance` (numeric) - Vale alimentação
  - `transportation_allowance` (numeric) - Vale transporte
  - `health_insurance` (numeric) - Plano de saúde
  - `other_benefits` (numeric) - Outros benefícios
  - `inss_deduction` (numeric) - INSS discount
  - `irrf_deduction` (numeric) - Income tax
  - `other_deductions` (numeric) - Other discounts
  - `gross_salary` (numeric) - Total before deductions
  - `net_salary` (numeric) - Final payment amount
  - `payment_date` (date) - When salary was paid
  - `payment_status` (text) - pending, processing, paid, cancelled
  - `payment_method` (text) - bank_transfer, check, cash
  - `notes` (text) - Additional observations
  - `created_by` (uuid, foreign key to profiles)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `payroll_adjustments`
  Track manual adjustments and corrections
  - `id` (uuid, primary key)
  - `payroll_id` (uuid, foreign key to payroll_records)
  - `adjustment_type` (text) - addition, deduction, correction
  - `amount` (numeric)
  - `reason` (text)
  - `created_by` (uuid, foreign key to profiles)
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Only authenticated admin users can manage payroll
  - Full audit trail with created_by tracking
*/

-- Create payroll_records table
CREATE TABLE IF NOT EXISTS payroll_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  reference_month text NOT NULL,
  reference_year integer NOT NULL,
  base_salary numeric(10,2) DEFAULT 0 NOT NULL,
  overtime_hours numeric(10,2) DEFAULT 0,
  overtime_amount numeric(10,2) DEFAULT 0,
  night_shift_hours numeric(10,2) DEFAULT 0,
  night_shift_amount numeric(10,2) DEFAULT 0,
  hazard_pay numeric(10,2) DEFAULT 0,
  food_allowance numeric(10,2) DEFAULT 0,
  transportation_allowance numeric(10,2) DEFAULT 0,
  health_insurance numeric(10,2) DEFAULT 0,
  other_benefits numeric(10,2) DEFAULT 0,
  inss_deduction numeric(10,2) DEFAULT 0,
  irrf_deduction numeric(10,2) DEFAULT 0,
  other_deductions numeric(10,2) DEFAULT 0,
  gross_salary numeric(10,2) DEFAULT 0 NOT NULL,
  net_salary numeric(10,2) DEFAULT 0 NOT NULL,
  payment_date date,
  payment_status text DEFAULT 'pending' NOT NULL,
  payment_method text,
  notes text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_payment_status CHECK (payment_status IN ('pending', 'processing', 'paid', 'cancelled')),
  CONSTRAINT valid_payment_method CHECK (payment_method IS NULL OR payment_method IN ('bank_transfer', 'check', 'cash')),
  CONSTRAINT unique_employee_month UNIQUE (employee_id, reference_month, reference_year)
);

-- Create payroll_adjustments table
CREATE TABLE IF NOT EXISTS payroll_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_id uuid REFERENCES payroll_records(id) ON DELETE CASCADE NOT NULL,
  adjustment_type text NOT NULL,
  amount numeric(10,2) NOT NULL,
  reason text NOT NULL,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_adjustment_type CHECK (adjustment_type IN ('addition', 'deduction', 'correction'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payroll_employee ON payroll_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_reference ON payroll_records(reference_year, reference_month);
CREATE INDEX IF NOT EXISTS idx_payroll_status ON payroll_records(payment_status);
CREATE INDEX IF NOT EXISTS idx_payroll_adjustments_payroll ON payroll_adjustments(payroll_id);

-- Enable RLS
ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_adjustments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payroll_records

-- Admins can do everything
CREATE POLICY "Admins can view all payroll records"
  ON payroll_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert payroll records"
  ON payroll_records FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update payroll records"
  ON payroll_records FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete payroll records"
  ON payroll_records FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for payroll_adjustments

CREATE POLICY "Admins can view all adjustments"
  ON payroll_adjustments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert adjustments"
  ON payroll_adjustments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update adjustments"
  ON payroll_adjustments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete adjustments"
  ON payroll_adjustments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payroll_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_payroll_records_updated_at
  BEFORE UPDATE ON payroll_records
  FOR EACH ROW
  EXECUTE FUNCTION update_payroll_updated_at();
