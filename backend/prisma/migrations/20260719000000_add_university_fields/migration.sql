-- AlterTable: bring "universities" in line with schema.prisma.
-- Some of these columns were already added out-of-band (drift); IF NOT EXISTS
-- makes this migration idempotent and safe to apply without touching existing data.
ALTER TABLE "universities" ADD COLUMN IF NOT EXISTS "accreditation_detail" TEXT;
ALTER TABLE "universities" ADD COLUMN IF NOT EXISTS "accreditation_type" TEXT;
ALTER TABLE "universities" ADD COLUMN IF NOT EXISTS "ranking_unirank" INTEGER;
ALTER TABLE "universities" ADD COLUMN IF NOT EXISTS "ranking_qs_world" TEXT;
ALTER TABLE "universities" ADD COLUMN IF NOT EXISTS "ranking_qs_latam" TEXT;
ALTER TABLE "universities" ADD COLUMN IF NOT EXISTS "founded_year" INTEGER;
ALTER TABLE "universities" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "universities" ADD COLUMN IF NOT EXISTS "featured_programs" TEXT[];
ALTER TABLE "universities" ADD COLUMN IF NOT EXISTS "highlighted_programs" TEXT;
ALTER TABLE "universities" ADD COLUMN IF NOT EXISTS "enrollment_url" TEXT;
ALTER TABLE "universities" ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "universities_accreditation_idx" ON "universities"("accreditation");
