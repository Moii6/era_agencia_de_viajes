import { TripStatus } from '@erp/db';
import { IsEnum, IsOptional } from 'class-validator';

export class QueryTripsDto {
  @IsOptional()
  @IsEnum(TripStatus)
  status?: TripStatus;
}
