import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

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
}
