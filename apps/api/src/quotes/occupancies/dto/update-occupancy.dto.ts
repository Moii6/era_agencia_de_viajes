import { IsInt, IsOptional, IsString, Min } from 'class-validator';

// roomTypeId is intentionally not editable — delete and recreate the
// occupancy line if the room type needs to change (it carries a price
// snapshot tied to the room type it was created with).
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
}
