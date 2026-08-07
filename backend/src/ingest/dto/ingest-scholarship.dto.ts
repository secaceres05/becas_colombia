import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Coverage, ScholarshipType } from '@prisma/client';

export class RequirementDto {
  @ApiProperty()
  @IsString()
  type: string;

  @ApiProperty()
  @IsString()
  label: string;

  @ApiProperty()
  @IsObject()
  value: Record<string, any>;
}

export class IngestScholarshipDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty({ enum: ScholarshipType })
  @IsEnum(ScholarshipType)
  type: ScholarshipType;

  @ApiProperty({ enum: Coverage })
  @IsEnum(Coverage)
  coverage: Coverage;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsUrl()
  official_url: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  application_url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  opening_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  closing_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  provider_name?: string;

  @ApiProperty({ required: true })
  @IsString()
  source_name: string;

  @ApiPropertyOptional({ description: 'Códigos DANE de los departamentos a los que está restringida la beca (NACIONAL)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  department_codes?: string[];

  @ApiPropertyOptional({ description: 'Continentes a los que está restringida la beca (INTERNACIONAL)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  continents?: string[];

  @ApiPropertyOptional({ type: [RequirementDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RequirementDto)
  requirements?: RequirementDto[];
}