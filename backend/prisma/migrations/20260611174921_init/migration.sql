-- CreateEnum
CREATE TYPE "ScholarshipType" AS ENUM ('NACIONAL', 'INTERNACIONAL');

-- CreateEnum
CREATE TYPE "Coverage" AS ENUM ('TOTAL', 'PARCIAL');

-- CreateEnum
CREATE TYPE "ScholarshipStatus" AS ENUM ('VIGENTE', 'CERRADA', 'PROXIMA');

-- CreateEnum
CREATE TYPE "RequirementType" AS ENUM ('SABER11_MIN', 'GPA_MIN', 'LANGUAGE', 'SISBEN', 'STRATUM', 'OTHER');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('GOBIERNO', 'UNIVERSIDAD', 'PRIVADA', 'FUNDACION', 'ORG_INTL');

-- CreateEnum
CREATE TYPE "UniversityType" AS ENUM ('PUBLICA', 'PRIVADA');

-- CreateEnum
CREATE TYPE "ProgramLevel" AS ENUM ('TECNICO', 'TECNOLOGO', 'PREGRADO', 'POSGRADO', 'MAESTRIA', 'DOCTORADO');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('SCRAPER', 'API', 'MANUAL', 'CSV');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPERADMIN', 'EDITOR');

-- CreateTable
CREATE TABLE "departments" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "dane_code" TEXT NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entities" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "EntityType" NOT NULL,
    "acronym" TEXT,
    "website" TEXT,

    CONSTRAINT "entities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sources" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "base_url" TEXT,
    "type" "SourceType" NOT NULL,
    "scrape_config" JSONB,
    "last_run_at" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scholarships" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "ScholarshipType" NOT NULL,
    "coverage" "Coverage" NOT NULL,
    "description" TEXT,
    "official_url" TEXT NOT NULL,
    "application_url" TEXT,
    "opening_date" TIMESTAMP(3),
    "closing_date" TIMESTAMP(3),
    "status" "ScholarshipStatus" NOT NULL DEFAULT 'PROXIMA',
    "needs_review" BOOLEAN NOT NULL DEFAULT true,
    "provider_id" INTEGER,
    "source_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scholarships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requirements" (
    "id" SERIAL NOT NULL,
    "type" "RequirementType" NOT NULL,
    "label" TEXT NOT NULL,
    "value" JSONB NOT NULL,

    CONSTRAINT "requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scholarship_requirements" (
    "scholarship_id" INTEGER NOT NULL,
    "requirement_id" INTEGER NOT NULL,

    CONSTRAINT "scholarship_requirements_pkey" PRIMARY KEY ("scholarship_id","requirement_id")
);

-- CreateTable
CREATE TABLE "scholarship_departments" (
    "scholarship_id" INTEGER NOT NULL,
    "department_id" INTEGER NOT NULL,

    CONSTRAINT "scholarship_departments_pkey" PRIMARY KEY ("scholarship_id","department_id")
);

-- CreateTable
CREATE TABLE "universities" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "UniversityType" NOT NULL,
    "department_id" INTEGER NOT NULL,
    "city" TEXT NOT NULL,
    "accreditation" BOOLEAN NOT NULL DEFAULT false,
    "website" TEXT,

    CONSTRAINT "universities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programs" (
    "id" SERIAL NOT NULL,
    "university_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "level" "ProgramLevel" NOT NULL,
    "accredited" BOOLEAN NOT NULL DEFAULT false,
    "snies_code" TEXT,
    "area_knowledge" TEXT,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admission_processes" (
    "id" SERIAL NOT NULL,
    "university_id" INTEGER NOT NULL,
    "program_id" INTEGER,
    "steps" JSONB NOT NULL,
    "registration_url" TEXT,
    "cost" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'COP',
    "calendar" JSONB NOT NULL,

    CONSTRAINT "admission_processes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'EDITOR',
    "refresh_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "departments_dane_code_key" ON "departments"("dane_code");

-- CreateIndex
CREATE UNIQUE INDEX "sources_name_key" ON "sources"("name");

-- CreateIndex
CREATE UNIQUE INDEX "scholarships_slug_key" ON "scholarships"("slug");

-- CreateIndex
CREATE INDEX "scholarships_status_idx" ON "scholarships"("status");

-- CreateIndex
CREATE INDEX "scholarships_type_idx" ON "scholarships"("type");

-- CreateIndex
CREATE INDEX "scholarships_closing_date_idx" ON "scholarships"("closing_date");

-- CreateIndex
CREATE INDEX "scholarships_needs_review_idx" ON "scholarships"("needs_review");

-- CreateIndex
CREATE INDEX "universities_department_id_idx" ON "universities"("department_id");

-- CreateIndex
CREATE INDEX "universities_type_idx" ON "universities"("type");

-- CreateIndex
CREATE INDEX "programs_university_id_idx" ON "programs"("university_id");

-- CreateIndex
CREATE INDEX "programs_level_idx" ON "programs"("level");

-- CreateIndex
CREATE INDEX "admission_processes_university_id_idx" ON "admission_processes"("university_id");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- AddForeignKey
ALTER TABLE "scholarships" ADD CONSTRAINT "scholarships_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "entities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scholarships" ADD CONSTRAINT "scholarships_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scholarship_requirements" ADD CONSTRAINT "scholarship_requirements_scholarship_id_fkey" FOREIGN KEY ("scholarship_id") REFERENCES "scholarships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scholarship_requirements" ADD CONSTRAINT "scholarship_requirements_requirement_id_fkey" FOREIGN KEY ("requirement_id") REFERENCES "requirements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scholarship_departments" ADD CONSTRAINT "scholarship_departments_scholarship_id_fkey" FOREIGN KEY ("scholarship_id") REFERENCES "scholarships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scholarship_departments" ADD CONSTRAINT "scholarship_departments_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "universities" ADD CONSTRAINT "universities_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_processes" ADD CONSTRAINT "admission_processes_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_processes" ADD CONSTRAINT "admission_processes_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
