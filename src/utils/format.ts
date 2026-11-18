const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
});

export function formatBRL(value: number): string {
  return currencyFormatter.format(value);
}

export function formatDateTime(isoString: string): { date: string; time: string } {
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) {
    return { date: '--/--/----', time: '--:--' };
  }
  return {
    date: dateFormatter.format(parsed),
    time: timeFormatter.format(parsed),
  };
}

export function parseBRLInput(raw: string): number | null {
  const cleaned = raw.replace(/[^\d.,]/g, '').trim();
  if (!cleaned) return null;

  let normalized: string;
  if (cleaned.includes(',')) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (/^\d+\.\d{1,2}$/.test(cleaned)) {
    normalized = cleaned;
  } else {
    normalized = cleaned.replace(/\./g, '');
  }

  const num = Number.parseFloat(normalized);
  if (!Number.isFinite(num) || num <= 0) {
    return null;
  }

  return Math.round(num * 100) / 100;
}
