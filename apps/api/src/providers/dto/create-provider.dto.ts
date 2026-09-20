import { ProviderType } from '@erp/db';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateProviderDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEnum(ProviderType)
  type: ProviderType;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  contacts?: string[];

  @IsOptional()
  @IsString()
  notes?: string;
}
