/*
  # Corrigir campos faltantes na tabela employees

  1. Alterações
    - Adicionar coluna `exit_date` (date, nullable)
    - Adicionar coluna `exit_reason` (text, nullable)

  2. Segurança
    - Sem mudanças nas políticas RLS existentes
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'exit_date'
  ) THEN
    ALTER TABLE employees ADD COLUMN exit_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'exit_reason'
  ) THEN
    ALTER TABLE employees ADD COLUMN exit_reason text;
  END IF;
END $$;