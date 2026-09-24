import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

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

  @IsOptional()
  @IsInt()
  @Min(0)
  quantityAvailable?: number;
}
