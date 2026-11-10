import { addDays, parseDate, tripLength } from './dates';
import { Season, TripContext, TripDetails, WeatherSummary } from './types';
import { findPlace, getTripWeather } from './weather';

const NORTHERN_SEASONS: Season[] = [
  'winter',
  'winter',
  'spring',
  'spring',
  'spring',
  'summer',
  'summer',
  'summer',
  'fall',
  'fall',
  'fall',
  'winter',
];

// Season in the middle of the trip, flipped for the southern hemisphere
function seasonFor(startDate: string, duration: number, latitude: number | null): Season {
  const middle = parseDate(addDays(startDate, Math.floor((duration - 1) / 2)));
  const month = latitude !== null && latitude < 0 ? (middle.getUTCMonth() + 6) % 12 : middle.getUTCMonth();
  return NORTHERN_SEASONS[month];
}

function climateFor(weather: WeatherSummary | null): string {
  if (!weather) return 'unknown';
  if (weather.avgHigh <= 8) return 'cold';
  if (weather.avgHigh <= 18) return 'mild';
  if (weather.avgHigh <= 27) return 'warm';
  return 'hot';
}

// Works out what the form no longer asks for. Weather is best effort, the list still works without it.
export async function buildTripContext(details: TripDetails): Promise<TripContext> {
  const duration = tripLength(details.startDate, details.endDate);
  let latitude: number | null = null;
  let weather: WeatherSummary | null = null;

  try {
    // Use the place picked from the suggestions, otherwise the best match for the text
    const place = details.destinationPlace ?? (await findPlace(details.destination));
    if (place) {
      latitude = place.latitude;
      weather = await getTripWeather(place, details.startDate, details.endDate);
    }
  } catch (error) {
    console.error('Weather lookup failed:', error);
  }

  return {
    ...details,
    duration,
    season: seasonFor(details.startDate, duration, latitude),
    climate: climateFor(weather),
    weather,
  };
}
