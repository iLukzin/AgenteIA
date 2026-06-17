import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateServiceDto {
  @IsString() @MaxLength(150) name: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() @Min(0) price?: number;
  @IsOptional() @IsInt() @Min(5) durationMinutes?: number;
  @IsOptional() @IsBoolean() active?: boolean;
}
