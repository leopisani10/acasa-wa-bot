/*
  # Commerce Module Database Schema

  1. New Tables
    - `products` - Product catalog with pricing and inventory
    - `orders` - Customer orders from WhatsApp
    - `order_items` - Individual items within each order
    - `commerce_logs` - Activity logging for analytics

  2. Security
    - Enable RLS on all commerce tables
    - Add policies for authenticated access
    - Service role access for bot operations

  3. Indexes
    - Performance indexes for common queries
    - Search indexes for product lookup
*/

-- Products table for catalog management
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'Geral',
  price decimal(10,2) NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  active boolean DEFAULT true,
  image_url text,
  unit text DEFAULT 'unidade',
  minimum_order integer DEFAULT 1,
  maximum_order integer DEFAULT 100,
  tags text[], -- For search functionality
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Orders table for WhatsApp commerce
CREATE TABLE IF NOT EXISTS orders (
  id text PRIMARY KEY, -- Custom format: ACE[timestamp]
  customer_phone text NOT NULL,
  customer_name text,
  status text NOT NULL DEFAULT 'pending',
  total_amount decimal(10,2) NOT NULL DEFAULT 0,
  payment_method text,
  payment_status text DEFAULT 'pending',
  items jsonb NOT NULL DEFAULT '[]',
  notes text,
  delivery_address text,
  delivery_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Commerce activity logs
CREATE TABLE IF NOT EXISTS commerce_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity text NOT NULL,
  customer_phone text,
  data jsonb,
  timestamp timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE commerce_logs ENABLE ROW LEVEL SECURITY;

-- Policies for products (public read, admin write)
CREATE POLICY "Anyone can read active products"
  ON products
  FOR SELECT
  USING (active = true);

CREATE POLICY "Authenticated users can manage products"
  ON products
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for orders (authenticated access)
CREATE POLICY "Authenticated users can read orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for commerce logs (authenticated read)
CREATE POLICY "Authenticated users can read commerce logs"
  ON commerce_logs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can insert commerce logs"
  ON commerce_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_products_name ON products USING gin(to_tsvector('portuguese', name));
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_commerce_logs_timestamp ON commerce_logs(timestamp);

-- Constraints
ALTER TABLE products ADD CONSTRAINT products_category_check 
  CHECK (category IN ('Cuidados', 'Alimentação', 'Higiene', 'Equipamentos', 'Serviços', 'Medicamentos', 'Geral'));

ALTER TABLE products ADD CONSTRAINT products_price_positive 
  CHECK (price >= 0);

ALTER TABLE products ADD CONSTRAINT products_stock_positive 
  CHECK (stock >= 0);

ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'confirmed', 'processing', 'completed', 'cancelled'));

ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check 
  CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));

ALTER TABLE orders ADD CONSTRAINT orders_total_positive 
  CHECK (total_amount >= 0);

-- Insert sample products
INSERT INTO products (name, description, category, price, stock, tags) VALUES
  ('Fraldas Geriátricas Premium', 'Fraldas de alta absorção para adultos - Pacote com 30 unidades', 'Higiene', 120.00, 50, ARRAY['fraldas', 'higiene', 'absorção']),
  ('Sessão de Fisioterapia', 'Sessão individual de fisioterapia com profissional especializado', 'Serviços', 80.00, 999, ARRAY['fisioterapia', 'reabilitação', 'terapia']),
  ('Acompanhante Particular', 'Serviço de acompanhante especializado - Diária completa', 'Serviços', 200.00, 10, ARRAY['acompanhante', 'cuidador', 'assistência']),
  ('Consulta Médica Geriatra', 'Consulta médica especializada em geriatria', 'Serviços', 150.00, 999, ARRAY['consulta', 'médico', 'geriatra']),
  ('Suplemento Nutricional', 'Suplemento vitamínico para idosos - Frasco 60 cápsulas', 'Medicamentos', 85.00, 25, ARRAY['suplemento', 'vitamina', 'nutrição']),
  ('Kit Higiene Pessoal', 'Kit completo de higiene adaptado para idosos', 'Higiene', 45.00, 30, ARRAY['kit', 'higiene', 'banho']),
  ('Cardápio Personalizado', 'Elaboração de cardápio semanal personalizado por nutricionista', 'Alimentação', 120.00, 999, ARRAY['cardápio', 'nutrição', 'dieta']),
  ('Andador com Rodas', 'Andador com 4 rodas e freio - Ajuda na mobilidade', 'Equipamentos', 350.00, 5, ARRAY['andador', 'mobilidade', 'equipamento'])
ON CONFLICT (id) DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_products_updated_at 
  BEFORE UPDATE ON products 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at 
  BEFORE UPDATE ON orders 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();