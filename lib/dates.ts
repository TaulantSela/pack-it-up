// Trip dates are calendar dates (YYYY-MM-DD), handled in UTC so they never shift by a day
const DAY_MS = 24 * 60 * 60 * 1000;

export function parseDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function todayDateString(): string {
  return toDateString(new Date());
}

export function addDays(value: string, days: number): string {
  return toDateString(new Date(parseDate(value).getTime() + days * DAY_MS));
}

export function addYears(value: string, years: number): string {
  const date = parseDate(value);
  date.setUTCFullYear(date.getUTCFullYear() + years);
  return toDateString(date);
}

// Inclusive, so a trip from the 10th to the 14th is 5 days
export function tripLength(startDate: string, endDate: string): number {
  return Math.round((parseDate(endDate).getTime() - parseDate(startDate).getTime()) / DAY_MS) + 1;
}

export function formatDateRange(start: string | Date, end: string | Date): string {
  const format = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  return format.formatRange(new Date(start), new Date(end));
}
