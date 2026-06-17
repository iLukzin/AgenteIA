import { IsIn, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

const PERSONALITIES = ['formal', 'profissional', 'amigavel', 'premium', 'consultiva'];

export class UpdateCompanyDto {
  @IsOptional() @IsString() @MaxLength(150) name?: string;
  @IsOptional() @IsString() @MaxLength(20) phone?: string;
  @IsOptional() @IsString() @MaxLength(20) whatsappNumber?: string;
  @IsOptional() @IsObject() address?: Record<string, any>;
  @IsOptional() @IsObject() businessHours?: Record<string, any>;
  @IsOptional() @IsObject() socialLinks?: Record<string, any>;
  @IsOptional() @IsIn(PERSONALITIES) aiPersonality?: string;
  @IsOptional() @IsString() greetingMessage?: string;
  @IsOptional() @IsString() awayMessage?: string;
  @IsOptional() @IsString() closingMessage?: string;
  @IsOptional() @IsString() handoffMessage?: string;
}
