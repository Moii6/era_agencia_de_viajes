import { ProviderType } from '@erp/db';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

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
  @IsString()
  contactInfo?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
