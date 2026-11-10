import { ComponentType } from 'react';
import { ACCOMMODATIONS, SEASONS, TRANSPORTS } from './trip-options';

export type Season = (typeof SEASONS)[number];
export type Transport = (typeof TRANSPORTS)[number];

// A place picked from the suggestions, so the server doesn't have to guess
export interface Place {
  label: string; // "Paris, France"
  region?: string; // "Île-de-France"
  countryCode?: string; // "FR"
  latitude: number;
  longitude: number;
}

// What the trip form sends
export interface TripDetails {
  origin: string;
  originPlace?: Place;
  destination: string;
  destinationPlace?: Place;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  transport: Transport;
  activities: string[];
  accommodation: (typeof ACCOMMODATIONS)[number];
  groupSize: number;
  includesChildren: boolean;
  specialNeeds: string[];
}

export interface WeatherSummary {
  place: string;
  kind: 'forecast' | 'typical';
  days: number;
  avgHigh: number;
  avgLow: number;
  maxHigh: number;
  minLow: number;
  rainyDays: number;
  snowyDays: number;
}

// Trip details plus what the server works out from them
export interface TripContext extends TripDetails {
  duration: number;
  season: Season;
  climate: string;
  weather: WeatherSummary | null;
}

export interface PackingItem {
  id: string;
  name: string;
  category: 'clothing' | 'toiletries' | 'electronics' | 'documents' | 'accessories' | 'other' | string;
  essential: boolean;
  quantity: number;
  notes?: string;
  aiSuggested?: boolean;
}

export interface IconI {
  name: ComponentType<{ className?: string }>;
  className?: string;
}
export interface LabelI {
  name: string;
  className?: string;
}
