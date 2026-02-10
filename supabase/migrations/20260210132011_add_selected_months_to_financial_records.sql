/*
  # Adicionar meses selecionados para taxas parceladas

  1. Mudanças
    - Adiciona colunas para armazenar meses específicos selecionados para cada tipo de taxa
    - Remove a dependência de meses sequenciais, permitindo seleção livre de meses
    - Cada coluna armazena um array de strings no formato 'YYYY-MM' (ex: ['2026-01', '2026-06', '2026-11'])

  2. Novas Colunas
    - `climatization_selected_months` - Array de meses para climatização
    - `maintenance_selected_months` - Array de meses para manutenção
    - `trousseau_selected_months` - Array de meses para enxoval
    - `thirteenth_salary_selected_months` - Array de meses para décimo terceiro

  3. Notas
    - As colunas antigas de parcelas e mês de início são mantidas para compatibilidade
    - Os novos campos têm prioridade sobre o cálculo sequencial antigo
    - Utiliza JSONB para armazenamento eficiente e consultas flexíveis
*/

-- Adicionar colunas para meses selecionados
ALTER TABLE guest_financial_records
ADD COLUMN IF NOT EXISTS climatization_selected_months JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS maintenance_selected_months JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS trousseau_selected_months JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS thirteenth_salary_selected_months JSONB DEFAULT '[]'::jsonb;