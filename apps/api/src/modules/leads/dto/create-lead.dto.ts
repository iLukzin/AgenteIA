import { IsIn, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

const STATUSES = ['new', 'qualified', 'proposal', 'won', 'lost'];

export class CreateLeadDto {
  @IsUUID() customerId: string;
  @IsOptional() @IsString() source?: string;
  @IsOptional() @IsIn(STATUSES) status?: string;
  @IsOptional() @IsNumber() @Min(0) estimatedValue?: number;
  @IsOptional() @IsString() notes?: string;
}
