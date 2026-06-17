import { IsArray, IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCustomerDto {
  @IsOptional() @IsString() @MaxLength(150) name?: string;
  @IsString() @MaxLength(20) phone: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsArray() tags?: string[];
  @IsOptional() @IsString() notes?: string;
}
