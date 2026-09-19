import { IsString, IsUUID, MinLength } from 'class-validator';

export class AssignSeatDto {
  @IsUUID()
  busId: string;

  @IsString()
  @MinLength(1)
  seatNumber: string;
}
