/*
  # Create Labor Agreements Module

  ## Overview
  This migration creates the database structure for managing labor agreements (acordos trabalhistas)
  between claimants and companies, including their payment installments.

  ## New Tables

  ### labor_agreements
  Main table storing labor agreement information:
  - `id` (uuid, primary key) - Unique identifier
  - `claimant_name` (text) - Name of the claimant (reclamante)
  - `company_name` (text) - Name of the company being sued
  - `lawyer_full_name` (text) - Full name of the lawyer handling the case
  - `pix_key` (text) - PIX key for payments to the lawyer
  - `process_number` (text, optional) - Legal process number
  - `labor_court` (text, optional) - Labor court name (vara trabalhista)
  - `jurisdiction` (text, optional) - Jurisdiction (comarca)
  - `total_amount` (numeric) - Total agreement amount
  - `installment_count` (integer) - Total number of installments
  - `notes` (text, optional) - General notes about the agreement
  - `created_by` (uuid) - User who created the record
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### labor_agreement_installments
  Table storing individual installment information:
  - `id` (uuid, primary key) - Unique identifier
  - `agreement_id` (uuid, foreign key) - Reference to parent agreement
  - `installment_number` (integer) - Sequential installment number (1, 2, 3...)
  - `amount` (numeric) - Installment amount
  - `due_date` (date) - Payment due date
  - `payment_status` (text) - Status: pending, paid, overdue
  - `payment_date` (date, optional) - Actual payment date
  - `payment_proof` (text, optional) - Payment proof or notes
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Enable RLS on both tables
  - Only authenticated admin users can access and modify records
  - Cascade delete: removing an agreement removes all its installments

  ## Indexes
  - Index on agreement_id for fast installment lookups
  - Index on due_date for vencimento queries
  - Index on payment_status for filtering
*/

-- Create labor_agreements table
CREATE TABLE IF NOT EXISTS labor_agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claimant_name text NOT NULL,
  company_name text NOT NULL,
  lawyer_full_name text NOT NULL,
  pix_key text NOT NULL,
  process_number text,
  labor_court text,
  jurisdiction text,
  total_amount numeric NOT NULL CHECK (total_amount > 0),
  installment_count integer NOT NULL CHECK (installment_count > 0),
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create labor_agreement_installments table
CREATE TABLE IF NOT EXISTS labor_agreement_installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id uuid NOT NULL REFERENCES labor_agreements(id) ON DELETE CASCADE,
  installment_number integer NOT NULL CHECK (installment_number > 0),
  amount numeric NOT NULL CHECK (amount > 0),
  due_date date NOT NULL,
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue')),
  payment_date date,
  payment_proof text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(agreement_id, installment_number)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_installments_agreement_id ON labor_agreement_installments(agreement_id);
CREATE INDEX IF NOT EXISTS idx_installments_due_date ON labor_agreement_installments(due_date);
CREATE INDEX IF NOT EXISTS idx_installments_payment_status ON labor_agreement_installments(payment_status);
CREATE INDEX IF NOT EXISTS idx_agreements_created_at ON labor_agreements(created_at DESC);

-- Enable Row Level Security
ALTER TABLE labor_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE labor_agreement_installments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for labor_agreements
CREATE POLICY "Admins can view all labor agreements"
  ON labor_agreements FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert labor agreements"
  ON labor_agreements FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update labor agreements"
  ON labor_agreements FOR UPDATE
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

CREATE POLICY "Admins can delete labor agreements"
  ON labor_agreements FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for labor_agreement_installments
CREATE POLICY "Admins can view all installments"
  ON labor_agreement_installments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert installments"
  ON labor_agreement_installments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update installments"
  ON labor_agreement_installments FOR UPDATE
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

CREATE POLICY "Admins can delete installments"
  ON labor_agreement_installments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_labor_agreement_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_labor_agreements_updated_at
  BEFORE UPDATE ON labor_agreements
  FOR EACH ROW
  EXECUTE FUNCTION update_labor_agreement_updated_at();

CREATE TRIGGER update_labor_agreement_installments_updated_at
  BEFORE UPDATE ON labor_agreement_installments
  FOR EACH ROW
  EXECUTE FUNCTION update_labor_agreement_updated_at();