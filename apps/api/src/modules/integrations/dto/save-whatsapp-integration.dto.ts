import { IsString, MaxLength, MinLength } from 'class-validator';

export class SaveWhatsappIntegrationDto {
  @IsString()
  @MaxLength(100)
  instanceName: string;

  // Propositalmente @IsString() em vez de @IsUrl(): instâncias
  // self-hosted da Evolution API costumam usar IP local ou porta
  // não padrão, e validadores de URL mais estritos às vezes rejeitam
  // esses formatos.
  @IsString()
  @MinLength(8)
  apiUrl: string;

  @IsString()
  @MinLength(10)
  apiKey: string;
}
