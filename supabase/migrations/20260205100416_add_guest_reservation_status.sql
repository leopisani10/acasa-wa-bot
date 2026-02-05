/*
  # Adicionar Sistema de Reservas para Hóspedes

  1. Alterações
    - Adiciona coluna `reservation_date` (data em que a reserva foi feita)
    - Adiciona coluna `expected_entry_date` (data prevista para entrada do hóspede)
    - Adiciona coluna `reservation_notes` (observações sobre a reserva/situação do hóspede)

  2. Motivo
    - Permitir o gerenciamento de hóspedes que pagaram sinal e reservaram vaga
    - Diferenciar de hóspedes ativos (já estão na casa) e inativos (saíram)
    - Rastrear previsão de entrada e motivo da espera (hospitalizado, etc)
    - O campo `status` já é TEXT e pode receber o valor 'Reservado'

  3. Segurança
    - Mantém as políticas RLS existentes da tabela guests
*/

-- Adicionar colunas de reserva
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'guests' AND column_name = 'reservation_date'
  ) THEN
    ALTER TABLE guests ADD COLUMN reservation_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'guests' AND column_name = 'expected_entry_date'
  ) THEN
    ALTER TABLE guests ADD COLUMN expected_entry_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'guests' AND column_name = 'reservation_notes'
  ) THEN
    ALTER TABLE guests ADD COLUMN reservation_notes text DEFAULT '';
  END IF;
END $$;

-- Adicionar comentários nas colunas para documentação
COMMENT ON COLUMN guests.reservation_date IS 'Data em que a reserva da vaga foi feita (quando deu o sinal)';
COMMENT ON COLUMN guests.expected_entry_date IS 'Data prevista para a entrada do hóspede na instituição';
COMMENT ON COLUMN guests.reservation_notes IS 'Observações sobre a reserva (ex: hospitalizado, aguardando alta, etc)';