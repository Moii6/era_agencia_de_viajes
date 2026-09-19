import { InteractionType } from '@erp/db';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateInteractionDto {
  @IsEnum(InteractionType)
  type: InteractionType;

  @IsString()
  @MinLength(1)
  content: string;

  @IsOptional()
  @IsDateString()
  occurredAt?: string;
}
