const WEEKDAY_TO_KEY: Record<string, string> = {
  Sun: 'dom',
  Mon: 'seg',
  Tue: 'ter',
  Wed: 'qua',
  Thu: 'qui',
  Fri: 'sex',
  Sat: 'sab',
};

interface DayHours {
  abre: string; // "09:00"
  fecha: string; // "18:00"
}

/**
 * Confere se "agora" está dentro do horário de funcionamento configurado
 * em companies.business_hours, considerando o fuso de São Paulo
 * independentemente do fuso do servidor onde a API está rodando.
 */
export function isWithinBusinessHours(
  businessHours: Record<string, DayHours | null> | null | undefined,
  timeZone = 'America/Sao_Paulo',
): boolean {
  if (!businessHours) return true; // sem horário configurado = considera sempre aberto

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());

  const weekday = parts.find((p) => p.type === 'weekday')?.value || 'Mon';
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');

  const dayKey = WEEKDAY_TO_KEY[weekday] || 'seg';
  const todayHours = businessHours[dayKey];
  if (!todayHours || !todayHours.abre || !todayHours.fecha) return false;

  const nowMinutes = hour * 60 + minute;
  const [openH, openM] = todayHours.abre.split(':').map(Number);
  const [closeH, closeM] = todayHours.fecha.split(':').map(Number);

  return nowMinutes >= openH * 60 + openM && nowMinutes <= closeH * 60 + closeM;
}
