import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UniversitiesService } from './universities.service';
import { FilterUniversitiesDto } from './dto/filter-universities.dto';

@ApiTags('Universities')
@Controller('universities')
export class UniversitiesController {
  constructor(private readonly universitiesService: UniversitiesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar universidades con filtros' })
  findAll(@Query() filters: FilterUniversitiesDto) {
    return this.universitiesService.findAll(filters);
  }

  @Get(':id/programs')
  @ApiOperation({ summary: 'Programas académicos de una universidad' })
  findPrograms(@Param('id', ParseIntPipe) id: number) {
    return this.universitiesService.findPrograms(id);
  }
}