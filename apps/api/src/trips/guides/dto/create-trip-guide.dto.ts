import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class CreateTripGuideDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsBoolean()
  isLead?: boolean;
}
