import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateQuoteDto {
  @IsUUID()
  clientId: string;

  @IsUUID()
  tripId: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
