import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateRoomTypeDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsString()
  characteristics?: string;

  @IsInt()
  @Min(1)
  maxOccupancy: number;

  @IsNumber()
  @Min(0)
  pricePerAdult: number;

  @IsNumber()
  @Min(0)
  pricePerMinor: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  quantityAvailable?: number;

  @IsOptional()
  @IsString()
  currency?: string;
}
