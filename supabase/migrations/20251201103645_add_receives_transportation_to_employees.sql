/*
  # Adicionar campo receives_transportation à tabela employees

  1. Alterações
    - Adicionar coluna `receives_transportation` (boolean) à tabela employees
    - Valor padrão: false

  2. Segurança
    - Sem mudanças nas políticas RLS existentes
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'receives_transportation'
  ) THEN
    ALTER TABLE employees ADD COLUMN receives_transportation boolean DEFAULT false;
  END IF;
END $$;