import { ClientStage } from '@erp/db';
import { IsEnum, IsOptional } from 'class-validator';

export class QueryClientsDto {
  @IsOptional()
  @IsEnum(ClientStage)
  stage?: ClientStage;
}
