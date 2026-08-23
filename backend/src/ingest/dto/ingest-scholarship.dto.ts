import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Coverage, EntityType, ScholarshipType } from '@prisma/client';

export class RequirementDto {
  @ApiProperty()
  @IsString()
  @MaxLength(100)
  type: string;

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  label: string;

  @ApiProperty()
  @IsObject()
  value: Record<string, any>;
}

export class IngestScholarshipDto {
  @ApiProperty()
  @IsString()
  @MaxLength(200)
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
  @MaxLength(5000)
  description?: string;

  @ApiProperty()
  @IsUrl()
  @MaxLength(500)
  official_url: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
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
  @MaxLength(200)
  provider_name?: string;

  @ApiPropertyOptional({ description: 'Tipo de entidad proveedora (UNIVERSIDAD, GOBIERNO, FUNDACION, PRIVADA, ORG_INTL). Si no llega, el backend lo infiere del nombre.', enum: EntityType })
  @IsOptional()
  @IsEnum(EntityType)
  provider_type?: EntityType;

  @ApiProperty({ required: true })
  @IsString()
  @MaxLength(200)
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