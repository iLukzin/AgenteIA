/**
 * Normaliza um número de WhatsApp para o formato que guardamos em
 * customers.phone: só dígitos, com DDI 55 na frente (padrão Brasil,
 * já que é o público-alvo do produto). Ajuste aqui se for vender para
 * fora do Brasil.
 */
export function normalizeBrazilianPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    return digits;
  }
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  return digits;
}

/** Extrai só o número de um remoteJid do Baileys/Evolution, ex: "5534999999999@s.whatsapp.net". */
export function phoneFromRemoteJid(remoteJid: string): string {
  return normalizeBrazilianPhone(remoteJid.split('@')[0] || '');
}
