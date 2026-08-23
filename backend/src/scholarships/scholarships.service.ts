import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FilterScholarshipsDto } from './dto/filter-scholarships.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ScholarshipsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: FilterScholarshipsDto) {
    const {
      type,
      coverage,
      status,
      department,
      continent,
      saber11_min,
      max_gpa_required,
      language,
      sisben,
      provider,
      closing_after,
      page = 1,
      limit = 20,
      sort = 'closing_date',
    } = filters;

    const where: Prisma.ScholarshipWhereInput = {
      needsReview: false,
    };

    if (type) where.type = type;
    if (coverage) where.coverage = coverage;
    if (status) where.status = status;
    if (closing_after) where.closingDate = { gte: new Date(closing_after) };

    if (provider) {
      where.provider = {
        OR: [
          { name: { contains: provider, mode: 'insensitive' } },
          { acronym: { contains: provider, mode: 'insensitive' } },
        ],
      };
    }

    if (department) {
      where.departments = {
        some: {
          department: { daneCode: department },
        },
      };
    }

    if (continent) {
      where.continents = { has: continent };
    }

    if (saber11_min !== undefined) {
      where.requirements = {
        some: {
          requirement: {
            type: 'SABER11_MIN',
            value: { path: ['min_score'], gte: saber11_min },
          },
        },
      };
    }

    if (max_gpa_required !== undefined) {
      where.requirements = {
        some: {
          requirement: {
            type: 'GPA_MIN',
            value: { path: ['min_score'], lte: max_gpa_required },
          },
        },
      };
    }

    if (language) {
      where.requirements = {
        some: {
          requirement: {
            type: 'LANGUAGE',
            value: { path: ['language'], equals: language.toUpperCase() },
          },
        },
      };
    }

    if (sisben !== undefined) {
      where.requirements = {
        some: {
          requirement: { type: 'SISBEN' },
        },
      };
    }

    const sortField: Record<string, Prisma.SortOrder> = {
      closing_date: 'asc',
      created_at: 'desc',
      title: 'asc',
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.scholarship.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sort === 'closing_date' ? 'closingDate' : sort === 'created_at' ? 'createdAt' : 'title']: sortField[sort] },
        include: {
          provider: { select: { name: true, acronym: true } },
          source: { select: { name: true } },
          requirements: {
            include: {
              requirement: true,
            },
          },
          departments: {
            include: {
              department: { select: { name: true, daneCode: true } },
            },
          },
        },
      }),
      this.prisma.scholarship.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findBySlug(slug: string) {
    return this.prisma.scholarship.findUniqueOrThrow({
      where: { slug },
      include: {
        provider: true,
        source: { select: { name: true, type: true } },
        requirements: { include: { requirement: true } },
        departments: { include: { department: true } },
      },
    });
  }
}