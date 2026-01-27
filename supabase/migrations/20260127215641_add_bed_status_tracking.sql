/*
  # Add Bed Status Tracking
  
  1. Changes
    - Add `status` column to beds table ('Ativa' or 'Inativa')
    - Add `inactive_reason` column to store why bed was deactivated
    - Add `deactivated_at` timestamp to track when bed was deactivated
    - Add `deactivated_by` to track who deactivated the bed
    
  2. Purpose
    - Track room capacity changes over time (triple to double to single)
    - Record why beds were removed from service
    - Maintain audit trail of bed status changes
    
  3. Security
    - No RLS changes needed as beds inherit from rooms policies
    
  4. Common Inactive Reasons
    - "Redução de capacidade" - Capacity reduction
    - "Manutenção" - Maintenance
    - "Reforma do quarto" - Room renovation
    - "Adequação para quarto individual" - Conversion to single room
    - "Adequação para quarto duplo" - Conversion to double room
*/

-- Add status column (default Ativa for existing beds)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'beds' AND column_name = 'status'
  ) THEN
    ALTER TABLE beds ADD COLUMN status text DEFAULT 'Ativa' CHECK (status IN ('Ativa', 'Inativa'));
  END IF;
END $$;

-- Add inactive_reason column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'beds' AND column_name = 'inactive_reason'
  ) THEN
    ALTER TABLE beds ADD COLUMN inactive_reason text;
  END IF;
END $$;

-- Add deactivated_at timestamp
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'beds' AND column_name = 'deactivated_at'
  ) THEN
    ALTER TABLE beds ADD COLUMN deactivated_at timestamptz;
  END IF;
END $$;

-- Add deactivated_by to track who deactivated
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'beds' AND column_name = 'deactivated_by'
  ) THEN
    ALTER TABLE beds ADD COLUMN deactivated_by text;
  END IF;
END $$;

-- Create index for active bed queries
CREATE INDEX IF NOT EXISTS idx_beds_status ON beds(status) WHERE status = 'Ativa';

-- Add constraint: inactive beds cannot have guests
DO $$
BEGIN
  -- Drop constraint if exists
  ALTER TABLE beds DROP CONSTRAINT IF EXISTS beds_inactive_no_guest_check;
  
  -- Add constraint: if status is 'Inativa', guest_id must be null
  ALTER TABLE beds ADD CONSTRAINT beds_inactive_no_guest_check 
    CHECK (status = 'Ativa' OR (status = 'Inativa' AND guest_id IS NULL));
END $$;

-- Add constraint: inactive beds must have a reason
DO $$
BEGIN
  -- Drop constraint if exists
  ALTER TABLE beds DROP CONSTRAINT IF EXISTS beds_inactive_reason_check;
  
  -- Add constraint: if status is 'Inativa', inactive_reason must be provided
  ALTER TABLE beds ADD CONSTRAINT beds_inactive_reason_check 
    CHECK (status = 'Ativa' OR (status = 'Inativa' AND inactive_reason IS NOT NULL));
END $$;