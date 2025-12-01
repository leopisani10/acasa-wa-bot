/*
  # Criar Tabela de Vale Transporte

  1. Nova Tabela
    - `transportation_vouchers`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, foreign key para employees)
      - `reference_month` (text) - Mês de referência (formato: "YYYY-MM")
      - `daily_value` (numeric) - Valor diário (ida e volta)
      - `working_days` (integer) - Quantidade de dias trabalhados
      - `total_value` (numeric) - Valor total calculado
      - `payment_date` (date) - Data do pagamento
      - `paid` (boolean) - Se foi pago ou não
      - `notes` (text) - Observações
      - `created_by` (uuid, foreign key para profiles)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Segurança
    - Habilitar RLS
    - Políticas para usuários autenticados
*/

CREATE TABLE IF NOT EXISTS transportation_vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  reference_month text NOT NULL,
  daily_value numeric(10,2) NOT NULL DEFAULT 0,
  working_days integer NOT NULL DEFAULT 0,
  total_value numeric(10,2) NOT NULL DEFAULT 0,
  payment_date date,
  paid boolean DEFAULT false,
  notes text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE transportation_vouchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view transportation vouchers"
  ON transportation_vouchers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert transportation vouchers"
  ON transportation_vouchers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update transportation vouchers"
  ON transportation_vouchers
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete transportation vouchers"
  ON transportation_vouchers
  FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_transportation_vouchers_employee ON transportation_vouchers(employee_id);
CREATE INDEX IF NOT EXISTS idx_transportation_vouchers_reference_month ON transportation_vouchers(reference_month);
CREATE INDEX IF NOT EXISTS idx_transportation_vouchers_paid ON transportation_vouchers(paid);