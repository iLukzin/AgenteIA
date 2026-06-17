import { IsOptional, IsUrl } from 'class-validator';

export class GenerateQrCodeDto {
  @IsOptional()
  @IsUrl({ require_tld: false })
  webhookUrl?: string;
}
