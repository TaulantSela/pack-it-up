import { MAX_TRAVELER_NAME } from './trip-options';

// Up to this many travelers, personal items get a named tick per person; bigger groups get a counter
export const MAX_TICKED_TRAVELERS = 6;

// One entry per person: trimmed names, "" where none was given
export function normalizeTravelers(names: string[] | undefined, groupSize: number): string[] {
  return Array.from({ length: groupSize }, (_, i) => (names?.[i] ?? '').trim().slice(0, MAX_TRAVELER_NAME));
}

// Null for trips created before per-person ticks, which keep one tick per item
export function parseTravelers(json: string | null | undefined, groupSize: number): string[] | null {
  if (!json) return null;
  try {
    const parsed: unknown = JSON.parse(json);
    if (!Array.isArray(parsed)) return null;
    return normalizeTravelers(
      parsed.map((name) => (typeof name === 'string' ? name : '')),
      groupSize,
    );
  } catch {
    return null;
  }
}

export function travelerLabel(travelers: string[], index: number): string {
  return travelers[index] || `Person ${index + 1}`;
}

// Items the group shares (one tent, one first aid kit) get one tick; the AI and the built-in list
// start their notes with "Shared:"
export function isSharedItem(notes: string | null | undefined): boolean {
  return /^\s*shared\s*:/i.test(notes ?? '');
}

// Key for one traveler's tick on one item in a Set of ticks
export function tickKey(itemId: string, person: number): string {
  return `${itemId}#${person}`;
}
