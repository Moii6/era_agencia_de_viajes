import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';

export class CreateTripDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  destination?: string;

  @IsDateString()
  departureDate: string;

  @IsOptional()
  @IsString()
  departureTime?: string;

  @IsString()
  @MinLength(2)
  departurePoint: string;

  @IsDateString()
  returnDate: string;

  @IsOptional()
  @IsString()
  returnTime?: string;

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
