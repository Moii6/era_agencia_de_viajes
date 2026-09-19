import { ReservationStatus } from '@erp/db';
import { IsEnum } from 'class-validator';

// CONFIRMED is intentionally not a valid manual target — it can only be
// reached automatically by registering the initial deposit (see
// ReservationsService.confirmIfInitialDeposit).
export class UpdateReservationDto {
  @IsEnum(ReservationStatus)
  status: ReservationStatus;
}
