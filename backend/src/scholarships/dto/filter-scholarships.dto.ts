import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import {
  Coverage,
  ScholarshipStatus,
  ScholarshipType,
} from '@prisma/client';

export class FilterScholarshipsDto {
  @ApiPropertyOptional({ enum: ScholarshipType })
  @IsOptional()
  @IsEnum(ScholarshipType)
  type?: ScholarshipType;

  @ApiPropertyOptional({ enum: Coverage })
  @IsOptional()
  @IsEnum(Coverage)
  coverage?: Coverage;

  @ApiPropertyOptional({ enum: ScholarshipStatus })
  @IsOptional()
  @IsEnum(ScholarshipStatus)
  status?: ScholarshipStatus;

  @ApiPropertyOptional({ description: 'Código DANE del departamento' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ description: 'Continente al que está restringida la beca (solo INTERNACIONAL)' })
  @IsOptional()
  @IsString()
  continent?: string;

  @ApiPropertyOptional({ description: 'Puntaje mínimo Saber 11 / ICFES' })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(0)
  @Max(500)
  saber11_min?: number;

  @ApiPropertyOptional({ description: 'Promedio máximo requerido (GPA)' })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @Min(0)
  @Max(5)
  max_gpa_required?: number;

  @ApiPropertyOptional({ description: 'Código de idioma requerido (EN, FR, DE)' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ description: 'Requiere Sisbén' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  sisben?: boolean;

  @ApiPropertyOptional({ description: 'Nombre o acrónimo del proveedor (ICETEX)' })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({ description: 'Fecha mínima de cierre (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  closing_after?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ default: 'closing_date' })
  @IsOptional()
  @IsEnum(['closing_date', 'created_at', 'title'])
  sort?: 'closing_date' | 'created_at' | 'title' = 'closing_date';
}