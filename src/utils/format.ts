import { format, parseISO, isValid, addDays, addWeeks, addMonths, addYears } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { FrequencyType } from '../types';

export function formatRupiah(amount: number, hideNumbers = false): string {
  if (hideNumbers) {
    return '••••••••';
  }
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(absAmount);

  return isNegative ? `-${formatted}` : formatted;
}

export function formatRupiahInput(value: string | number | undefined | null): string {
  if (value === undefined || value === null || value === '') return '';
  const clean = String(value).replace(/\D/g, '');
  if (!clean) return '';
  return new Intl.NumberFormat('id-ID').format(Number(clean));
}

export function parseRupiahInput(value: string | number | undefined | null): number {
  if (value === undefined || value === null || value === '') return 0;
  const clean = String(value).replace(/\D/g, '');
  return clean ? Number(clean) : 0;
}

export function formatCompactRupiah(amount: number, hideNumbers = false): string {
  if (hideNumbers) {
    return '••••••••';
  }
  const abs = Math.abs(amount);
  const prefix = amount < 0 ? '-Rp ' : 'Rp ';
  if (abs >= 1_000_000_000) {
    return `${prefix}${(abs / 1_000_000_000).toFixed(1).replace('.0', '')} M`;
  }
  if (abs >= 1_000_000) {
    return `${prefix}${(abs / 1_000_000).toFixed(1).replace('.0', '')} jt`;
  }
  if (abs >= 1_000) {
    return `${prefix}${(abs / 1_000).toFixed(0)} rb`;
  }
  return formatRupiah(amount, false);
}

export function formatDateId(dateStr: string, formatPattern = 'dd/MM/yyyy'): string {
  if (!dateStr) return '-';
  try {
    const parsed = parseISO(dateStr);
    if (!isValid(parsed)) return dateStr;
    // Normalize legacy textual date patterns to dd/MM/yyyy
    const normalizedPattern =
      formatPattern === 'EEEE, d MMM yyyy' || formatPattern === 'EEEE, dd MMM yyyy'
        ? 'EEEE, dd/MM/yyyy'
        : formatPattern === 'd MMMM yyyy' ||
          formatPattern === 'd MMM yyyy' ||
          formatPattern === 'dd MMM yyyy' ||
          formatPattern === 'd MMM' ||
          formatPattern === 'MMM yyyy'
        ? 'dd/MM/yyyy'
        : formatPattern;
    return format(parsed, normalizedPattern, { locale: localeId });
  } catch {
    return dateStr;
  }
}

export function formatTime24(timeStr?: string): string {
  if (!timeStr) return '00:00';
  const trimmed = timeStr.trim();
  // Match 12-hour format like "02:30 PM" or "2:30 am"
  const ampmMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const mins = ampmMatch[2];
    const period = ampmMatch[3].toUpperCase();
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${mins}`;
  }
  // Match 24-hour format like "9:05" or "14:30" or "14:30:00"
  const h24Match = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (h24Match) {
    const hours = Math.min(23, Math.max(0, parseInt(h24Match[1], 10)));
    const mins = Math.min(59, Math.max(0, parseInt(h24Match[2], 10)));
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }
  return trimmed;
}

export function formatDateTime24(dateInput: Date | string = new Date()): string {
  try {
    const d = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
    if (!isValid(d)) return String(dateInput);
    return format(d, 'dd/MM/yyyy HH:mm', { locale: localeId });
  } catch {
    return String(dateInput);
  }
}

export function formatMonthYearId(monthIso: string): string {
  if (!monthIso || monthIso === 'ALL') return 'Semua Periode';
  try {
    const parsed = parseISO(monthIso.length === 7 ? `${monthIso}-01` : monthIso);
    if (!isValid(parsed)) return monthIso;
    return format(parsed, 'MM/yyyy (MMMM yyyy)', { locale: localeId });
  } catch {
    return monthIso;
  }
}

export function getTodayIso(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function getCurrentMonthIso(): string {
  return format(new Date(), 'yyyy-MM');
}

export function calculateNextOccurrence(startDateStr: string, frequency: FrequencyType): string {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let nextDate = parseISO(startDateStr);
    if (!isValid(nextDate)) return getTodayIso();

    let safety = 0;
    while (nextDate < today && safety < 500) {
      safety++;
      if (frequency === 'Harian') nextDate = addDays(nextDate, 1);
      else if (frequency === 'Mingguan') nextDate = addWeeks(nextDate, 1);
      else if (frequency === 'Bulanan') nextDate = addMonths(nextDate, 1);
      else if (frequency === 'Tahunan') nextDate = addYears(nextDate, 1);
    }
    return format(nextDate, 'yyyy-MM-dd');
  } catch {
    return startDateStr;
  }
}

export function advanceDateByFrequency(currentDateStr: string, frequency: FrequencyType): string {
  try {
    const base = parseISO(currentDateStr);
    const start = isValid(base) ? base : new Date();
    let nextDate = start;
    if (frequency === 'Harian') nextDate = addDays(start, 1);
    else if (frequency === 'Mingguan') nextDate = addWeeks(start, 1);
    else if (frequency === 'Bulanan') nextDate = addMonths(start, 1);
    else if (frequency === 'Tahunan') nextDate = addYears(start, 1);
    return format(nextDate, 'yyyy-MM-dd');
  } catch {
    return getTodayIso();
  }
}

export function generateUuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function terbilang(n: number): string {
  if (n <= 0) return '';
  const satuan = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
  if (n < 12) return satuan[n];
  if (n < 20) return `${terbilang(n - 10)} belas`;
  if (n < 100) return `${terbilang(Math.floor(n / 10))} puluh ${terbilang(n % 10)}`.trim();
  if (n < 200) return `seratus ${terbilang(n - 100)}`.trim();
  if (n < 1000) return `${terbilang(Math.floor(n / 100))} ratus ${terbilang(n % 100)}`.trim();
  if (n < 2000) return `seribu ${terbilang(n - 1000)}`.trim();
  if (n < 1000000) return `${terbilang(Math.floor(n / 1000))} ribu ${terbilang(n % 1000)}`.trim();
  if (n < 1000000000) return `${terbilang(Math.floor(n / 1000000))} juta ${terbilang(n % 1000000)}`.trim();
  if (n < 1000000000000) return `${terbilang(Math.floor(n / 1000000000))} miliar ${terbilang(n % 1000000000)}`.trim();
  if (n < 1000000000000000) return `${terbilang(Math.floor(n / 1000000000000))} triliun ${terbilang(n % 1000000000000)}`.trim();
  return '';
}

export function terbilangRupiah(amount: number): string {
  if (!amount || amount <= 0) return '';
  const t = terbilang(Math.floor(amount));
  if (!t) return '';
  const formatted = t.charAt(0).toUpperCase() + t.slice(1);
  return `${formatted} rupiah`;
}

