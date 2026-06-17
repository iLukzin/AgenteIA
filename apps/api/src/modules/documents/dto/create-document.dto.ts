import { IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Por enquanto a base de conhecimento é alimentada por texto colado
 * direto no painel (FAQ, políticas, descrições de serviço etc.), e não
 * por upload de arquivo — ainda não há integração com um storage real.
 * Isso já cobre boa parte do uso real para PMEs; upload de PDF/DOCX
 * fica para uma próxima etapa (parsing do arquivo + Supabase Storage).
 */
export class CreateDocumentDto {
  @IsString()
  @MaxLength(255)
  filename: string;

  @IsString()
  @MinLength(20, { message: 'Cole um texto com pelo menos 20 caracteres.' })
  content: string;
}
