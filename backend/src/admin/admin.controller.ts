import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ScholarshipStatus, UniversityType } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminService } from './admin.service';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('scholarships')
  @ApiOperation({ summary: 'Listar todas las becas' })
  findAll(@Query('status') status?: ScholarshipStatus) {
    return this.adminService.findAll(status);
  }

  @Get('scholarships/pending')
  @ApiOperation({ summary: 'Cola de revisión: becas scrapeadas pendientes' })
  pending() {
    return this.adminService.getPendingReview();
  }

  @Patch('scholarships/:id/publish')
  @ApiOperation({ summary: 'Publicar beca (VIGENTE + quita needs_review)' })
  publish(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.publish(id);
  }

  @Patch('scholarships/:id')
  @ApiOperation({ summary: 'Editar campos de una beca' })
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.adminService.update(id, body);
  }

  @Delete('scholarships/:id')
  @ApiOperation({ summary: 'Eliminar beca' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.remove(id);
  }

  // ---- Universidades ----

  @Get('universities')
  @ApiOperation({ summary: 'Listar universidades (admin, con paginación)' })
  findAllUniversities(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('type') type?: UniversityType,
    @Query('accreditation') accreditation?: string,
  ) {
    return this.adminService.findAllUniversities({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 250,
      search,
      type,
      accreditation: accreditation === undefined ? undefined : accreditation === 'true',
    });
  }

  @Post('universities')
  @ApiOperation({ summary: 'Crear universidad' })
  createUniversity(@Body() body: any) {
    return this.adminService.createUniversity(body);
  }

  @Patch('universities/:id')
  @ApiOperation({ summary: 'Editar universidad' })
  updateUniversity(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.adminService.updateUniversity(id, body);
  }

  // ---- Programas ----

  @Post('programs')
  @ApiOperation({ summary: 'Crear programa académico' })
  createProgram(@Body() body: any) {
    return this.adminService.createProgram(body);
  }

  @Delete('programs/:id')
  @ApiOperation({ summary: 'Eliminar programa académico' })
  removeProgram(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.removeProgram(id);
  }

  // ---- Procesos de admisión ----

  @Get('admission-processes')
  @ApiOperation({ summary: 'Listar procesos de admisión' })
  findAdmissionProcesses() {
    return this.adminService.findAdmissionProcesses();
  }

  @Post('admission-processes')
  @ApiOperation({ summary: 'Crear proceso de admisión' })
  createAdmissionProcess(@Body() body: any) {
    return this.adminService.createAdmissionProcess(body);
  }

  @Delete('admission-processes/:id')
  @ApiOperation({ summary: 'Eliminar proceso de admisión' })
  removeAdmissionProcess(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.removeAdmissionProcess(id);
  }
}
