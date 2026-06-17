import { IsDateString, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateAppointmentDto {
  @IsUUID() customerId: string;
  @IsOptional() @IsUUID() serviceId?: string;
  @IsOptional() @IsUUID() employeeId?: string;
  @IsDateString() scheduledAt: string;
  @IsOptional() @IsInt() @Min(5) durationMinutes?: number;
  @IsOptional() @IsString() notes?: string;
}
