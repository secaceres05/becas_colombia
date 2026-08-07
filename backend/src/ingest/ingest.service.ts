import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IngestScholarshipDto } from './dto/ingest-scholarship.dto';
import { ScholarshipStatus } from '@prisma/client';
import slugify from 'slugify';

@Injectable()
export class IngestService {
  constructor(private readonly prisma: PrismaService) {}

  async ingestScholarship(dto: IngestScholarshipDto) {
    const {
      title,
      type,
      coverage,
      description,
      official_url,
      application_url,
      opening_date,
      closing_date,
      provider_name,
      source_name,
      requirements = [],
      department_codes = [],
      continents = [],
    } = dto;

    // 1. Resolver o crear Source
    const source = await this.prisma.source.upsert({
      where: { name: source_name },
      update: { lastRunAt: new Date() },
      create: { name: source_name, type: 'SCRAPER', lastRunAt: new Date() },
    });

    // 2. Resolver o crear Entity (proveedor)
    let providerId: number | null = null;
    if (provider_name) {
    let entity = await this.prisma.entity.findFirst({
        where: { name: provider_name },
    });
    if (!entity) {
        entity = await this.prisma.entity.create({
        data: { name: provider_name, type: 'GOBIERNO' },
        });
    }
    providerId = entity.id;
    }

    // 3. Generar slug único
    const baseSlug = slugify(title, { lower: true, strict: true });
    const existing = await this.prisma.scholarship.findFirst({
      where: { officialUrl: official_url },
    });

    let slug = baseSlug;
    if (!existing) {
      const count = await this.prisma.scholarship.count({
        where: { slug: { startsWith: baseSlug } },
      });
      if (count > 0) slug = `${baseSlug}-${count + 1}`;
    } else {
      slug = existing.slug;
    }

    // 4. Upsert Scholarship
    const scholarship = await this.prisma.scholarship.upsert({
      where: { slug },
      update: {
        title,
        type,
        coverage,
        description,
        applicationUrl: application_url,
        openingDate: opening_date ? new Date(opening_date) : null,
        closingDate: closing_date ? new Date(closing_date) : null,
        status: ScholarshipStatus.PROXIMA,
        needsReview: true,
        continents,
        sourceId: source.id,
        providerId,
      },
      create: {
        title,
        slug,
        type,
        coverage,
        description,
        officialUrl: official_url,
        applicationUrl: application_url,
        openingDate: opening_date ? new Date(opening_date) : null,
        closingDate: closing_date ? new Date(closing_date) : null,
        status: ScholarshipStatus.PROXIMA,
        needsReview: true,
        continents,
        sourceId: source.id,
        providerId,
      },
    });

    // Restricción de departamentos/región (solo aplica a becas NACIONAL)
    await this.prisma.scholarshipDepartment.deleteMany({
      where: { scholarshipId: scholarship.id },
    });
    if (department_codes.length > 0) {
      const departments = await this.prisma.department.findMany({
        where: { daneCode: { in: department_codes } },
        select: { id: true },
      });
      if (departments.length > 0) {
        await this.prisma.scholarshipDepartment.createMany({
          data: departments.map(d => ({ scholarshipId: scholarship.id, departmentId: d.id })),
          skipDuplicates: true,
        });
      }
    }

    // 5. Upsert Requirements
    if (requirements.length > 0) {
      await this.prisma.scholarshipRequirement.deleteMany({
        where: { scholarshipId: scholarship.id },
      });

      for (const req of requirements) {
        const requirement = await this.prisma.requirement.create({
          data: {
            type: req.type as any,
            label: req.label,
            value: req.value,
          },
        });
        await this.prisma.scholarshipRequirement.create({
          data: {
            scholarshipId: scholarship.id,
            requirementId: requirement.id,
          },
        });
      }
    }

    return {
      id: scholarship.id,
      slug: scholarship.slug,
      action: existing ? 'updated' : 'created',
    };
  }
}