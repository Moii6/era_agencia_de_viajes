import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { CheckInLeg } from '@erp/db';

export class CreateCheckInDto {
  @IsUUID()
  seatAssignmentId: string;

  @IsEnum(CheckInLeg)
  leg: CheckInLeg;

  @IsOptional()
  @IsBoolean()
  checkedIn?: boolean;

  @IsOptional()
  @IsString()
  note?: string;
}
