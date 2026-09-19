import { QuoteStatus } from '@erp/db';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

// clientId/tripId are intentionally not editable after creation — start a
// new quote instead of repointing one to a different client/trip.
export class UpdateQuoteDto {
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(QuoteStatus)
  status?: QuoteStatus;
}
