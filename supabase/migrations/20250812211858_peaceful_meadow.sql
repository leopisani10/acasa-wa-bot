```sql
-- CreateTable
CREATE TABLE "public"."sobreaviso_employees" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "full_name" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "pix" TEXT,
    "unit" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "observations" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) DEFAULT now(),
    "updated_at" TIMESTAMPTZ(6) DEFAULT now(),

    CONSTRAINT "sobreaviso_employees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sobreaviso_employees_cpf_key" ON "public"."sobreaviso_employees"("cpf");

-- AddForeignKey
ALTER TABLE "public"."sobreaviso_employees" ADD CONSTRAINT "sobreaviso_employees_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Policies
ALTER TABLE "public"."sobreaviso_employees" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can create sobreaviso employees" ON "public"."sobreaviso_employees"
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can read sobreaviso employees" ON "public"."sobreaviso_employees"
  FOR SELECT USING (true);

CREATE POLICY "Users can update sobreaviso employees they created or admins can update all" ON "public"."sobreaviso_employees"
  FOR UPDATE USING (auth.uid() = created_by OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')) WITH CHECK (auth.uid() = created_by OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Users can delete sobreaviso employees they created or admins can delete all" ON "public"."sobreaviso_employees"
  FOR DELETE USING (auth.uid() = created_by OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Trigger for updated_at
CREATE FUNCTION update_updated_at_sobreaviso()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sobreaviso_employees_updated_at
BEFORE UPDATE ON public.sobreaviso_employees
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_sobreaviso();

-- Enum for unit
ALTER TABLE "public"."sobreaviso_employees" ADD CONSTRAINT "sobreaviso_employees_unit_check" CHECK (unit IN ('Botafogo', 'Tijuca', 'Ambas'));

-- Enum for status
ALTER TABLE "public"."sobreaviso_employees" ADD CONSTRAINT "sobreaviso_employees_status_check" CHECK (status IN ('Ativo', 'Inativo'));
```