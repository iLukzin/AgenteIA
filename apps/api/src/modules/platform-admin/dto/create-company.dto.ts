import { IsEmail, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  @MaxLength(150)
  companyName: string;

  @IsString()
  @MaxLength(150)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsUUID()
  planId?: string;
}
