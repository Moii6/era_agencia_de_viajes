import { TravelerType } from '@erp/db';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

// quoteOccupancyId is intentionally not editable — remove and re-add the
// traveler if they belong to a different occupancy group.
export class UpdateTravelerDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  fullName?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  age?: number;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(TravelerType)
  type?: TravelerType;

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
