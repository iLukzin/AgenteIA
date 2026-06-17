import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

const STATUSES = ['new', 'qualified', 'proposal', 'won', 'lost'];

export class UpdateLeadDto {
  @IsOptional() @IsIn(STATUSES) status?: string;
  @IsOptional() @IsNumber() @Min(0) estimatedValue?: number;
  @IsOptional() @IsString() notes?: string;
}
