/*
  # Atualizar Datas de Vencimento de Contrato
  
  1. Mudanças
    - Atualiza todos os contratos existentes para terem data de vencimento = data de admissão + 30 meses
    - Adiciona trigger para calcular automaticamente a data de vencimento em novos registros e atualizações
  
  2. Notas
    - Apenas atualiza registros onde a data de vencimento é nula ou onde a admissão existe
    - O trigger garante que futuras inserções/atualizações calculem automaticamente
*/

-- Atualizar contratos existentes: data de vencimento = data de admissão + 30 meses
UPDATE guests 
SET contract_expiry_date = (admission_date + INTERVAL '30 months')::date
WHERE admission_date IS NOT NULL;

-- Criar função para calcular data de vencimento automaticamente
CREATE OR REPLACE FUNCTION calculate_contract_expiry_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.admission_date IS NOT NULL THEN
    NEW.contract_expiry_date := (NEW.admission_date + INTERVAL '30 months')::date;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para calcular automaticamente em INSERT e UPDATE
DROP TRIGGER IF EXISTS set_contract_expiry_date ON guests;
CREATE TRIGGER set_contract_expiry_date
  BEFORE INSERT OR UPDATE OF admission_date
  ON guests
  FOR EACH ROW
  EXECUTE FUNCTION calculate_contract_expiry_date();