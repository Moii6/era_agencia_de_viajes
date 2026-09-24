import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

// roomTypeId is intentionally not editable — delete and recreate the
// occupancy line if the room type needs to change.
export class UpdateOccupancyDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  adults?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minors?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  subtotal?: number;
}
