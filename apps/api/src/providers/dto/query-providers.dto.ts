import { ProviderType } from '@erp/db';
import { IsEnum, IsOptional } from 'class-validator';

export class QueryProvidersDto {
  @IsOptional()
  @IsEnum(ProviderType)
  type?: ProviderType;
}
