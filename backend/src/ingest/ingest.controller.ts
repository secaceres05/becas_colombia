import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IngestService } from './ingest.service';
import { IngestScholarshipDto } from './dto/ingest-scholarship.dto';
import { ApiKeyGuard } from '../common/guards/api-key.guard';

@ApiTags('Ingest')
@ApiSecurity('scraper')
@UseGuards(ApiKeyGuard)
@Controller('ingest')
export class IngestController {
  constructor(private readonly ingestService: IngestService) {}

  @Post()
  @Throttle({ medium: { ttl: 60000, limit: 30 } })
  @ApiOperation({ summary: 'Ingestar beca desde scraper (requiere x-api-key)' })
  ingest(@Body() dto: IngestScholarshipDto) {
    return this.ingestService.ingestScholarship(dto);
  }
}