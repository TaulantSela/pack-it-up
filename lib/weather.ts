import { addDays, addYears, todayDateString, tripLength } from './dates';
import { WeatherSummary } from './types';
import { pluralize } from './utils';

// Open-Meteo is free for non-commercial use, needs no key, and asks for attribution
const TIMEOUT_MS = 5000;
const FORECAST_DAYS = 16;
const ARCHIVE_DELAY_DAYS = 6;
const HISTORY_YEARS = 3;
const RAINY_DAY_MM = 1;
const SNOWY_DAY_CM = 0.5;

const COUNTRY_ALIASES: Record<string, string> = { usa: 'us', uk: 'gb', uae: 'ae' };

export interface Place {
  label: string;
  latitude: number;
  longitude: number;
}

interface GeocodingResult {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  country_code?: string;
  admin1?: string;
}

interface DailyWeather {
  temperature_2m_max: (number | null)[];
  temperature_2m_min: (number | null)[];
  precipitation_sum: (number | null)[];
  snowfall_sum: (number | null)[];
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!response.ok) {
    throw new Error(`Open-Meteo returned ${response.status} for ${new URL(url).pathname}`);
  }
  return response.json();
}

// "Paris, France" searches for Paris and prefers the result in France over Paris, Texas
export async function findPlace(query: string): Promise<Place | null> {
  const [name, ...rest] = query
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  if (!name) return null;

  const hint = rest.join(' ').toLowerCase();
  const hintWords = hint.split(/\s+/).map((word) => COUNTRY_ALIASES[word] ?? word);
  const params = new URLSearchParams({ name, count: '10', language: 'en', format: 'json' });
  const data = await fetchJson<{ results?: GeocodingResult[] }>(
    `https://geocoding-api.open-meteo.com/v1/search?${params}`,
  );
  const results = data.results ?? [];

  const matchesHint = (result: GeocodingResult) => {
    const names = [result.country, result.admin1].filter(Boolean).map((value) => value!.toLowerCase());
    return (
      names.some((value) => hint.includes(value) || value.includes(hint)) ||
      hintWords.includes(result.country_code?.toLowerCase() ?? '')
    );
  };

  const match = (hint && results.find(matchesHint)) || results[0];
  if (!match) return null;

  return {
    label: [match.name, match.country].filter(Boolean).join(', '),
    latitude: match.latitude,
    longitude: match.longitude,
  };
}

async function fetchDaily(base: string, place: Place, startDate: string, endDate: string): Promise<DailyWeather> {
  const params = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum',
    timezone: 'auto',
    start_date: startDate,
    end_date: endDate,
  });
  const data = await fetchJson<{ daily: DailyWeather }>(`${base}?${params}`);
  return data.daily;
}

function summarize(place: Place, kind: WeatherSummary['kind'], days: number, samples: DailyWeather[]): WeatherSummary {
  const values = (key: keyof DailyWeather) =>
    samples.flatMap((sample) => sample[key]).filter((value): value is number => typeof value === 'number');
  const highs = values('temperature_2m_max');
  const lows = values('temperature_2m_min');
  const average = (list: number[]) => Math.round(list.reduce((sum, value) => sum + value, 0) / list.length);
  const daysPerSample = (key: keyof DailyWeather, threshold: number) =>
    Math.round(values(key).filter((value) => value >= threshold).length / samples.length);

  if (!highs.length || !lows.length) {
    throw new Error('Open-Meteo returned no temperatures');
  }

  return {
    place: place.label,
    kind,
    days,
    avgHigh: average(highs),
    avgLow: average(lows),
    maxHigh: Math.round(Math.max(...highs)),
    minLow: Math.round(Math.min(...lows)),
    rainyDays: Math.min(daysPerSample('precipitation_sum', RAINY_DAY_MM), days),
    snowyDays: Math.min(daysPerSample('snowfall_sum', SNOWY_DAY_CM), days),
  };
}

// Uses the forecast when the whole trip is within it, otherwise the same dates in recent years
export async function getTripWeather(place: Place, startDate: string, endDate: string): Promise<WeatherSummary> {
  const today = todayDateString();
  const days = tripLength(startDate, endDate);

  if (endDate >= today && endDate <= addDays(today, FORECAST_DAYS - 1)) {
    const from = startDate < today ? today : startDate;
    const forecast = await fetchDaily('https://api.open-meteo.com/v1/forecast', place, from, endDate);
    return summarize(place, 'forecast', days, [forecast]);
  }

  // Go back far enough that the dates are in the archive, which lags a few days behind
  const archiveEnd = addDays(today, -ARCHIVE_DELAY_DAYS);
  let yearsBack = 1;
  while (addYears(endDate, -yearsBack) > archiveEnd) {
    yearsBack += 1;
  }

  const samples = await Promise.all(
    Array.from({ length: HISTORY_YEARS }, (_, index) =>
      fetchDaily(
        'https://archive-api.open-meteo.com/v1/archive',
        place,
        addYears(startDate, -(yearsBack + index)),
        addYears(endDate, -(yearsBack + index)),
      ),
    ),
  );
  return summarize(place, 'typical', days, samples);
}

export function describeWeather(weather: WeatherSummary): string {
  const parts = [`${weather.minLow} to ${weather.maxHigh}°C`];
  if (weather.rainyDays > 0) parts.push(`rain on ${weather.rainyDays} of ${weather.days} days`);
  if (weather.snowyDays > 0) parts.push(`snow on ${pluralize(weather.snowyDays, 'day')}`);
  return parts.join(' · ');
}
