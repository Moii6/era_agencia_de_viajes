import { TripStatus } from '@erp/db';
import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateTripDto } from './create-trip.dto';

export class UpdateTripDto extends PartialType(CreateTripDto) {
  @IsOptional()
  @IsEnum(TripStatus)
  status?: TripStatus;
}
