import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';

export class CreateBusDto {
  @IsString()
  @MinLength(1)
  label: string;

  @IsOptional()
  @IsUUID()
  providerId?: string;

  @IsInt()
  @Min(1)
  seatCapacity: number;

  @IsOptional()
  @IsString()
  plateOrUnitNumber?: string;

  @IsOptional()
  @IsString()
  driverName?: string;

  @IsOptional()
  @IsString()
  driverPhone?: string;

  @IsOptional()
  @IsString()
  driverLicense?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
