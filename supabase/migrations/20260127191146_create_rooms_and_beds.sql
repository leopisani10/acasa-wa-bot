/*
  # Create Rooms and Beds Management System

  1. New Tables
    - `rooms`
      - `id` (uuid, primary key)
      - `room_number` (text) - Número do quarto
      - `floor` (integer) - Andar (1, 2 ou 3)
      - `bed_count` (integer) - Quantidade de camas no quarto
      - `notes` (text, optional) - Observações sobre o quarto
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `beds`
      - `id` (uuid, primary key)
      - `room_id` (uuid, foreign key) - Referência ao quarto
      - `bed_number` (integer) - Número da cama dentro do quarto
      - `guest_id` (uuid, foreign key, nullable) - Hóspede alocado
      - `notes` (text, optional) - Observações sobre a cama
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage rooms and beds
    - Ensure guest_id references guests table
*/

-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number text NOT NULL,
  floor integer NOT NULL CHECK (floor IN (1, 2, 3)),
  bed_count integer NOT NULL CHECK (bed_count > 0 AND bed_count <= 10),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create beds table
CREATE TABLE IF NOT EXISTS beds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  bed_number integer NOT NULL CHECK (bed_number > 0),
  guest_id uuid REFERENCES guests(id) ON DELETE SET NULL,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(room_id, bed_number)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rooms_floor ON rooms(floor);
CREATE INDEX IF NOT EXISTS idx_beds_room_id ON beds(room_id);
CREATE INDEX IF NOT EXISTS idx_beds_guest_id ON beds(guest_id);

-- Enable RLS
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds ENABLE ROW LEVEL SECURITY;

-- Policies for rooms table
CREATE POLICY "Authenticated users can view rooms"
  ON rooms FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert rooms"
  ON rooms FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update rooms"
  ON rooms FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete rooms"
  ON rooms FOR DELETE
  TO authenticated
  USING (true);

-- Policies for beds table
CREATE POLICY "Authenticated users can view beds"
  ON beds FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert beds"
  ON beds FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update beds"
  ON beds FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete beds"
  ON beds FOR DELETE
  TO authenticated
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_rooms_updated_at ON rooms;
CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_beds_updated_at ON beds;
CREATE TRIGGER update_beds_updated_at
  BEFORE UPDATE ON beds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();