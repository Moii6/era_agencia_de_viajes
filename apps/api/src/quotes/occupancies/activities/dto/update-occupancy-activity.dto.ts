import { IsInt, Min } from 'class-validator';

export class UpdateOccupancyActivityDto {
  @IsInt()
  @Min(1)
  quantity: number;
}
