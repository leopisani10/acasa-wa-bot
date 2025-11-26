/*
  # Adicionar tipo de permanência aos hóspedes

  1. Alterações
    - Adiciona coluna `stay_type` à tabela `guests`
      - Valores permitidos: 'Longa Permanência' ou 'Centro Dia'
      - Campo obrigatório com valor padrão 'Longa Permanência'
  
  2. Notas
    - Facilita o controle e estatísticas de hóspedes por tipo de permanência
    - Permite filtros e relatórios específicos por modalidade
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'guests' AND column_name = 'stay_type'
  ) THEN
    ALTER TABLE guests 
    ADD COLUMN stay_type text NOT NULL DEFAULT 'Longa Permanência'
    CHECK (stay_type IN ('Longa Permanência', 'Centro Dia'));
  END IF;
END $$;
