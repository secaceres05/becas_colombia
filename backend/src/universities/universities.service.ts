import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FilterUniversitiesDto } from './dto/filter-universities.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class UniversitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: FilterUniversitiesDto) {
    const { type, department, accreditation, search, sort, page = 1, limit = 20 } = filters;

    const where: Prisma.UniversityWhereInput = {};

    if (type) where.type = type;
    if (accreditation !== undefined) where.accreditation = accreditation;
    if (department) where.department = { daneCode: department };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.university.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sort === 'name'
          ? [{ name: 'asc' }]
          : [
              { rankingUnirank: { sort: 'asc', nulls: 'last' } },
              { name: 'asc' },
            ],
        select: {
          id: true,
          name: true,
          type: true,
          city: true,
          accreditation: true,
          accreditationDetail: true,
          accreditationType: true,
          website: true,
          rankingUnirank: true,
          rankingQsWorld: true,
          rankingQsLatam: true,
          foundedYear: true,
          description: true,
          featuredPrograms: true,
          highlightedPrograms: true,
          enrollmentUrl: true,
          notes: true,
          department: { select: { name: true, daneCode: true } },
          _count: { select: { programs: true } },
        },
      }),
      this.prisma.university.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findPrograms(universityId: number) {
    const university = await this.prisma.university.findUnique({
      where: { id: universityId },
      include: {
        department: { select: { name: true, daneCode: true } },
      },
    });

    if (!university) {
      throw new NotFoundException(`Universidad ${universityId} no encontrada`);
    }

    const programs = await this.prisma.program.findMany({
      where: { universityId },
      orderBy: { name: 'asc' },
    });

    return { university, programs };
  }
}