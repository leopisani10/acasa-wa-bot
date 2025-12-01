/*
  # Remove Foreign Key Constraint on Payroll Records

  ## Overview
  Removes the foreign key constraint that forces employee_id to reference only the employees table.
  This allows payroll records to be created for both regular employees and sobreaviso (contract) workers.

  ## Changes
  1. Drop the foreign key constraint on employee_id
  2. Keep the column as uuid but without the constraint
  3. This allows flexibility to reference either employees or sobreaviso_employees

  ## Important Notes
  - Data integrity must now be maintained at the application level
  - The employee_id can now reference either:
    - employees.id (regular CLT employees)
    - sobreaviso_employees.id (contract/on-call workers)
*/

-- Drop the foreign key constraint
ALTER TABLE payroll_records 
  DROP CONSTRAINT IF EXISTS payroll_records_employee_id_fkey;

-- Add a comment to document this
COMMENT ON COLUMN payroll_records.employee_id IS 
  'Employee ID - can reference either employees.id or sobreaviso_employees.id';
