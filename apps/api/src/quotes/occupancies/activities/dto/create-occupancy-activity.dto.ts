import { IsInt, IsUUID, Min } from 'class-validator';

export class CreateOccupancyActivityDto {
  @IsUUID()
  activityId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}
