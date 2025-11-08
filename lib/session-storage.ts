import { PackingItem, TripDetails } from './types';

const SESSION_KEY = 'pack-it-up-current-trip';

export type GuestProgressEntry = {
  itemId: string;
  checked: boolean;
};

export type GuestTripSession = {
  trip: {
    id: string;
    name: string;
    destination: string;
    duration: number;
    season: string;
    climate: string;
    activities: string;
    accommodation: string;
    groupSize: number;
    includesChildren: boolean;
    specialNeeds: string;
    createdAt: string;
    updatedAt: string;
    userId: string | null;
    items: PackingItem[];
    progress: GuestProgressEntry[];
  };
  tripDetails: TripDetails;
  savedAt: string;
};

export function saveGuestTripSession(session: GuestTripSession): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('Failed to save guest trip session:', error);
  }
}

export function loadGuestTripSession(): GuestTripSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.sessionStorage.getItem(SESSION_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as GuestTripSession;
  } catch (error) {
    console.error('Failed to load guest trip session:', error);
    return null;
  }
}

export function clearGuestTripSession(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.error('Failed to clear guest trip session:', error);
  }
}
