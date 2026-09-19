import { ReservationStatus } from '@erp/db';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export class QueryReservationsDto {
  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsUUID()
  tripId?: string;
}
