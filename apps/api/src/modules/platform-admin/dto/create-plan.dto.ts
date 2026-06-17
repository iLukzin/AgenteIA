import { IsInt, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreatePlanDto {
  @IsString() @MaxLength(50) name: string;
  @IsNumber() @Min(0) monthlyPrice: number;
  @IsInt() @Min(1) messageLimit: number;
  @IsOptional() @IsInt() @Min(1) whatsappNumbersLimit?: number;
}
