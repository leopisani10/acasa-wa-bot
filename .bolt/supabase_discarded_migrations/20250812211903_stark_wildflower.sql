```sql
-- CreateTable
CREATE TABLE "public"."candidates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "desired_position" TEXT NOT NULL,
    "experience_years" INTEGER NOT NULL,
    "curriculum_url" TEXT,
    "city" TEXT,
    "state" TEXT NOT NULL DEFAULT 'RJ',
    "availability" TEXT,
    "salary_expectation" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Novo',
    "source" TEXT NOT NULL DEFAULT 'Manual/CRM',
    "lgpd_consent" BOOLEAN NOT NULL DEFAULT FALSE,
    "notes" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) DEFAULT now(),
    "updated_at" TIMESTAMPTZ(6) DEFAULT now(),

    CONSTRAINT "candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."candidate_activities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "candidate_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduled_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "status" TEXT NOT NULL DEFAULT 'Pendente',
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) DEFAULT now(),

    CONSTRAINT "candidate_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "candidates_email_key" ON "public"."candidates"("email");

-- CreateIndex
CREATE UNIQUE INDEX "candidates_phone_key" ON "public"."candidates"("phone");

-- CreateIndex
CREATE INDEX "idx_candidates_status" ON "public"."candidates"("status");

-- CreateIndex
CREATE INDEX "idx_candidates_position" ON "public"."candidates"("desired_position");

-- CreateIndex
CREATE INDEX "idx_candidate_activities_candidate_id" ON "public"."candidate_activities"("candidate_id");

-- AddForeignKey
ALTER TABLE "public"."candidates" ADD CONSTRAINT "candidates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."candidate_activities" ADD CONSTRAINT "candidate_activities_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."candidate_activities" ADD CONSTRAINT "candidate_activities_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Policies for candidates table
ALTER TABLE "public"."candidates" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can create candidates" ON "public"."candidates"
  FOR INSERT WITH CHECK (true); -- Public form, so no created_by check

CREATE POLICY "Authenticated users can read candidates" ON "public"."candidates"
  FOR SELECT USING (true);

CREATE POLICY "Users can update candidates they created or admins can update all" ON "public"."candidates"
  FOR UPDATE USING (auth.uid() = created_by OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')) WITH CHECK (auth.uid() = created_by OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Users can delete candidates they created or admins can delete all" ON "public"."candidates"
  FOR DELETE USING (auth.uid() = created_by OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Policies for candidate_activities table
ALTER TABLE "public"."candidate_activities" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage candidate activities" ON "public"."candidate_activities"
  FOR ALL USING (true) WITH CHECK (true);

-- Enums for candidates
ALTER TABLE "public"."candidates" ADD CONSTRAINT "candidates_status_check" CHECK (status IN ('Novo', 'Triagem', 'Entrevista Agendada', 'Entrevistado', 'Aprovado', 'Contratado', 'Rejeitado', 'Inativo'));
ALTER TABLE "public"."candidates" ADD CONSTRAINT "candidates_source_check" CHECK (source IN ('Site/Formulário', 'Indicação', 'LinkedIn', 'WhatsApp', 'Email', 'Presencial', 'Outro', 'Manual/CRM'));
ALTER TABLE "public"."candidates" ADD CONSTRAINT "candidates_state_check" CHECK (state IN ('AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO', 'Outro'));

-- Enums for candidate_activities
ALTER TABLE "public"."candidate_activities" ADD CONSTRAINT "candidate_activities_type_check" CHECK (type IN ('Ligação', 'Email', 'WhatsApp', 'Entrevista', 'Tarefa', 'Anotação'));
ALTER TABLE "public"."candidate_activities" ADD CONSTRAINT "candidate_activities_status_check" CHECK (status IN ('Pendente', 'Em Andamento', 'Concluída', 'Cancelada'));

-- Trigger for updated_at on candidates table
CREATE FUNCTION update_updated_at_candidates()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER candidates_updated_at
BEFORE UPDATE ON public.candidates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_candidates();
```