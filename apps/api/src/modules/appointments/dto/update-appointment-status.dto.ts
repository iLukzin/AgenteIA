import { IsIn } from 'class-validator';

const STATUSES = ['scheduled', 'confirmed', 'cancelled', 'completed', 'no_show'];

export class UpdateAppointmentStatusDto {
  @IsIn(STATUSES) status: string;
}
