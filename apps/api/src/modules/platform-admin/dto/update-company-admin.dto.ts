import { IsIn, IsOptional, IsUUID } from 'class-validator';

const STATUSES = ['active', 'suspended', 'cancelled'];

export class UpdateCompanyAdminDto {
  @IsOptional() @IsUUID() planId?: string;
  @IsOptional() @IsIn(STATUSES) status?: string;
}
