import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, ScholarshipStatus, UniversityType } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  getPendingReview() {
    return this.prisma.scholarship.findMany({
      where: { needsReview: true },
      orderBy: { createdAt: 'desc' },
      include: {
        provider: { select: { name: true } },
        source: { select: { name: true } },
      },
    });
  }

  async publish(id: number) {
    await this.findScholarshipOrFail(id);
    return this.prisma.scholarship.update({
      where: { id },
      data: { needsReview: false, status: ScholarshipStatus.VIGENTE },
    });
  }

  async remove(id: number) {
    await this.findScholarshipOrFail(id);
    return this.prisma.scholarship.delete({ where: { id } });
  }

  async update(id: number, data: any) {
    await this.findScholarshipOrFail(id);
    return this.prisma.scholarship.update({
      where: { id },
      data: {
        ...data,
        closingDate: data.closingDate ? new Date(data.closingDate) : undefined,
      },
    });
  }

  findAll(status?: ScholarshipStatus) {
    return this.prisma.scholarship.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'desc' },
      include: {
        provider: { select: { name: true } },
        source: { select: { name: true } },
        _count: { select: { requirements: true } },
      },
    });
  }

  private async findScholarshipOrFail(id: number) {
    const s = await this.prisma.scholarship.findUnique({ where: { id } });
    if (!s) throw new NotFoundException(`Beca ${id} no encontrada`);
    return s;
  }

  // ---- Universidades ----

  async findAllUniversities(opts: {
    page: number;
    limit: number;
    search?: string;
    type?: UniversityType;
    accreditation?: boolean;
  }) {
    const { page, limit, search, type, accreditation } = opts;

    const where: Prisma.UniversityWhereInput = {};
    if (type) where.type = type;
    if (accreditation !== undefined) where.accreditation = accreditation;
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
        orderBy: [{ rankingUnirank: { sort: 'asc', nulls: 'last' } }, { name: 'asc' }],
        include: {
          department: { select: { id: true, name: true, daneCode: true } },
          _count: { select: { programs: true } },
        },
      }),
      this.prisma.university.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async createUniversity(data: any) {
    if (!data.name || !data.type || !data.city || !data.departmentId) {
      throw new BadRequestException('name, type, city y departmentId son requeridos');
    }
    return this.prisma.university.create({
      data: {
        name: data.name,
        type: data.type,
        city: data.city,
        departmentId: Number(data.departmentId),
        accreditation: !!data.accreditation,
        accreditationDetail: data.accreditationDetail || undefined,
        accreditationType: data.accreditationType || undefined,
        website: data.website || undefined,
        rankingUnirank: data.rankingUnirank !== undefined && data.rankingUnirank !== '' ? Number(data.rankingUnirank) : undefined,
        rankingQsWorld: data.rankingQsWorld || undefined,
        rankingQsLatam: data.rankingQsLatam || undefined,
        foundedYear: data.foundedYear !== undefined && data.foundedYear !== '' ? Number(data.foundedYear) : undefined,
        description: data.description || undefined,
        highlightedPrograms: data.highlightedPrograms || undefined,
        enrollmentUrl: data.enrollmentUrl || undefined,
        notes: data.notes || undefined,
      },
    });
  }

  async updateUniversity(id: number, data: any) {
    await this.findUniversityOrFail(id);

    const payload: Prisma.UniversityUpdateInput = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.city !== undefined) payload.city = data.city;
    if (data.type !== undefined) payload.type = data.type;
    if (data.website !== undefined) payload.website = data.website || null;
    if (data.accreditation !== undefined) payload.accreditation = !!data.accreditation;
    if (data.accreditationDetail !== undefined) payload.accreditationDetail = data.accreditationDetail || null;
    if (data.accreditationType !== undefined) payload.accreditationType = data.accreditationType || null;
    if (data.description !== undefined) payload.description = data.description || null;
    if (data.highlightedPrograms !== undefined) payload.highlightedPrograms = data.highlightedPrograms || null;
    if (data.enrollmentUrl !== undefined) payload.enrollmentUrl = data.enrollmentUrl || null;
    if (data.notes !== undefined) payload.notes = data.notes || null;
    if (data.rankingUnirank !== undefined) {
      payload.rankingUnirank = data.rankingUnirank === '' || data.rankingUnirank === null ? null : Number(data.rankingUnirank);
    }
    if (data.rankingQsWorld !== undefined) payload.rankingQsWorld = data.rankingQsWorld || null;
    if (data.rankingQsLatam !== undefined) payload.rankingQsLatam = data.rankingQsLatam || null;
    if (data.foundedYear !== undefined) {
      payload.foundedYear = data.foundedYear === '' || data.foundedYear === null ? null : Number(data.foundedYear);
    }
    if (data.departmentId !== undefined) {
      payload.department = { connect: { id: Number(data.departmentId) } };
    }

    return this.prisma.university.update({ where: { id }, data: payload });
  }

  private async findUniversityOrFail(id: number) {
    const u = await this.prisma.university.findUnique({ where: { id } });
    if (!u) throw new NotFoundException(`Universidad ${id} no encontrada`);
    return u;
  }

  // ---- Programas ----

  async createProgram(data: any) {
    if (!data.universityId || !data.name || !data.level) {
      throw new BadRequestException('universityId, name y level son requeridos');
    }
    return this.prisma.program.create({
      data: {
        universityId: Number(data.universityId),
        name: data.name,
        level: data.level,
        accredited: !!data.accredited,
        sniesCode: data.sniesCode || undefined,
        areaKnowledge: data.areaKnowledge || undefined,
      },
    });
  }

  async removeProgram(id: number) {
    const p = await this.prisma.program.findUnique({ where: { id } });
    if (!p) throw new NotFoundException(`Programa ${id} no encontrado`);
    return this.prisma.program.delete({ where: { id } });
  }

  // ---- Procesos de admisión ----

  findAdmissionProcesses() {
    return this.prisma.admissionProcess.findMany({
      orderBy: { id: 'desc' },
      include: {
        university: { select: { id: true, name: true } },
        program: { select: { id: true, name: true } },
      },
    });
  }

  async createAdmissionProcess(data: any) {
    if (!data.universityId) {
      throw new BadRequestException('universityId es requerido');
    }
    return this.prisma.admissionProcess.create({
      data: {
        universityId: Number(data.universityId),
        programId: data.programId ? Number(data.programId) : undefined,
        registrationUrl: data.registrationUrl || undefined,
        cost: data.cost !== undefined && data.cost !== '' && data.cost !== null ? new Prisma.Decimal(data.cost) : undefined,
        currency: data.currency || 'COP',
        calendar: data.calendar ?? {},
        steps: data.steps ?? [],
      },
      include: {
        university: { select: { id: true, name: true } },
        program: { select: { id: true, name: true } },
      },
    });
  }

  async removeAdmissionProcess(id: number) {
    const p = await this.prisma.admissionProcess.findUnique({ where: { id } });
    if (!p) throw new NotFoundException(`Proceso de admisión ${id} no encontrado`);
    return this.prisma.admissionProcess.delete({ where: { id } });
  }
}
