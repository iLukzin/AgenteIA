import { IsArray, IsBoolean, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateEmployeeDto {
  @IsString() @MaxLength(150) name: string;
  @IsOptional() @IsArray() specialties?: string[];
  @IsOptional() @IsObject() workSchedule?: Record<string, any>;
  @IsOptional() @IsBoolean() active?: boolean;
}
