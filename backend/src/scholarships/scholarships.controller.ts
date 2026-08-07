import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ScholarshipsService } from './scholarships.service';
import { FilterScholarshipsDto } from './dto/filter-scholarships.dto';

@ApiTags('Scholarships')
@Controller('scholarships')
export class ScholarshipsController {
  constructor(private readonly scholarshipsService: ScholarshipsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar becas con filtros combinados' })
  findAll(@Query() filters: FilterScholarshipsDto) {
    return this.scholarshipsService.findAll(filters);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Obtener beca por slug' })
  findOne(@Param('slug') slug: string) {
    return this.scholarshipsService.findBySlug(slug);
  }
}