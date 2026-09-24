import { IsInt, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateOccupancyDto {
  @IsUUID()
  roomTypeId: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsInt()
  @Min(0)
  adults: number;

  @IsInt()
  @Min(0)
  minors: number;

  // The total the hotel quoted for this room for the whole stay (not per
  // night) — typed in by whoever built the quote, not computed.
  @IsNumber()
  @Min(0)
  subtotal: number;
}
