import { QuoteStatus } from '@erp/db';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export class QueryQuotesDto {
  @IsOptional()
  @IsEnum(QuoteStatus)
  status?: QuoteStatus;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsUUID()
  tripId?: string;
}
