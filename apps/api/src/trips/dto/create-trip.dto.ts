import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
  MinLength,
} from 'class-validator';

// Required at creation (see TripsService.combineDateAndTime): without a
// real departure time, a trip can never tell when it should auto-advance
// to IN_PROGRESS — it would just sit PUBLISHED forever. Still optional on
// UpdateTripDto (via PartialType) so trips created before this requirement
// stay editable without being forced to backfill one immediately.
const TIME_FORMAT = /^([01]?\d|2[0-3]):([0-5]\d)$/;

export class CreateTripDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  destination?: string;

  @IsDateString()
  departureDate: string;

  @Matches(TIME_FORMAT, { message: 'departureTime debe tener formato HH:MM' })
  departureTime: string;

  @IsString()
  @MinLength(2)
  departurePoint: string;

  @IsDateString()
  returnDate: string;

  @Matches(TIME_FORMAT, { message: 'returnTime debe tener formato HH:MM' })
  returnTime: string;

  @IsString()
  @MinLength(2)
  returnPoint: string;

  @IsOptional()
  @IsBoolean()
  transportIncluded?: boolean;

  @IsOptional()
  @IsString()
  transportNotes?: string;

  @IsOptional()
  @IsBoolean()
  lodgingIncluded?: boolean;

  @IsOptional()
  @IsUUID()
  hotelProviderId?: string;

  @IsInt()
  @Min(1)
  capacity: number;

  @IsNumber()
  @Min(0)
  minimumDepositAmount: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
