/*
  # Corrigir campos opcionais da tabela guests

  1. Alterações
    - Remove restrição NOT NULL de campos que devem ser opcionais:
      - birth_date: pode não ter data de nascimento conhecida
      - admission_date: pode estar em processo de admissão
      - contract_expiry_date: pode não ter contrato definido
      - room_number: pode não ter quarto atribuído ainda
      - legal_responsible_relationship: só necessário se tiver responsável legal
      - legal_responsible_cpf: só necessário se tiver responsável legal
      - financial_responsible_name: só necessário se tiver responsável financeiro
      - financial_responsible_rg: só necessário se tiver responsável financeiro
      - financial_responsible_cpf: só necessário se tiver responsável financeiro
      - financial_responsible_marital_status: só necessário se tiver responsável financeiro
      - financial_responsible_phone: só necessário se tiver responsável financeiro
      - financial_responsible_address: só necessário se tiver responsável financeiro

  2. Notas
    - Mantém NOT NULL apenas para campos essenciais: full_name, gender, cpf, rg, document_issuer, status, dependency_level, unit
    - Campos de data com valores padrão nulos permitem maior flexibilidade no cadastro
*/

-- Alterar campos de data para serem nullable
ALTER TABLE guests ALTER COLUMN birth_date DROP NOT NULL;
ALTER TABLE guests ALTER COLUMN admission_date DROP NOT NULL;
ALTER TABLE guests ALTER COLUMN contract_expiry_date DROP NOT NULL;

-- Alterar room_number para ser nullable
ALTER TABLE guests ALTER COLUMN room_number DROP NOT NULL;

-- Alterar campos do responsável legal para serem nullable
ALTER TABLE guests ALTER COLUMN legal_responsible_relationship DROP NOT NULL;
ALTER TABLE guests ALTER COLUMN legal_responsible_cpf DROP NOT NULL;

-- Alterar campos do responsável financeiro para serem nullable
ALTER TABLE guests ALTER COLUMN financial_responsible_name DROP NOT NULL;
ALTER TABLE guests ALTER COLUMN financial_responsible_rg DROP NOT NULL;
ALTER TABLE guests ALTER COLUMN financial_responsible_cpf DROP NOT NULL;
ALTER TABLE guests ALTER COLUMN financial_responsible_marital_status DROP NOT NULL;
ALTER TABLE guests ALTER COLUMN financial_responsible_phone DROP NOT NULL;
ALTER TABLE guests ALTER COLUMN financial_responsible_address DROP NOT NULL;

-- Alterar application_date da tabela guest_vaccines para ser nullable
ALTER TABLE guest_vaccines ALTER COLUMN application_date DROP NOT NULL;