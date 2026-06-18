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

  // Três situações bem diferentes que a versão anterior tratava todas
  // como "fechado", e que é exatamente o motivo pelo qual toda empresa
  // nascia sempre fora do horário (o padrão no banco é "{}", e nesse
  // caso TODO dia cai aqui como undefined):
  //   - chave do dia nem existe no objeto (undefined) => esse dia não
  //     foi configurado, então não há restrição => considera aberto.
  //   - chave existe mas é null => foi configurado explicitamente como
  //     fechado nesse dia (ex: domingo) => considera fechado.
  //   - chave existe mas está mal formada (sem abre/fecha) => não
  //     bloqueia por engano, considera aberto.
  if (todayHours === undefined) return true;
  if (todayHours === null) return false;
  if (!todayHours.abre || !todayHours.fecha) return true;

  const nowMinutes = hour * 60 + minute;
  const [openH, openM] = todayHours.abre.split(':').map(Number);
  const [closeH, closeM] = todayHours.fecha.split(':').map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  if (closeMinutes <= openMinutes) {
    // O horário de fechamento "cruza" a virada do dia — ex: fecha às
    // 00:00 (meia-noite) ou, num bar, abre 18:00 e fecha 02:00. Sem
    // isso, "fecha: 00:00" virava 0 minuto do dia, e a comparação
    // normal (nowMinutes <= 0) nunca seria verdadeira — ou seja,
    // "fechar à meia-noite" era lido como "nunca está aberto".
    return nowMinutes >= openMinutes || nowMinutes <= closeMinutes;
  }

  return nowMinutes >= openMinutes && nowMinutes <= closeMinutes;
}
