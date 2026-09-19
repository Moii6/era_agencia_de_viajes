import { TravelerType } from '@erp/db';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';

export class CreateTravelerDto {
  @IsUUID()
  quoteOccupancyId: string;

  @IsString()
  @MinLength(2)
  fullName: string;

  @IsInt()
  @Min(0)
  age: number;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsEnum(TravelerType)
  type: TravelerType;

  @IsOptional()
  @IsBoolean()
  isHolder?: boolean;

  @IsOptional()
  @IsString()
  documentId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
