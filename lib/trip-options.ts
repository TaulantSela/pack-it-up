export const ACTIVITIES = [
  'hiking',
  'beach',
  'skiing',
  'business',
  'camping',
  'sightseeing',
  'shopping',
  'dining',
  'nightlife',
  'sports',
  'photography',
  'relaxation',
] as const;

export const TRANSPORTS = ['flight-carry-on', 'flight-checked', 'car', 'train-bus'] as const;

export const TRANSPORT_LABELS: Record<(typeof TRANSPORTS)[number], string> = {
  'flight-carry-on': 'Flight, carry-on only',
  'flight-checked': 'Flight with checked bag',
  car: 'Car',
  'train-bus': 'Train or bus',
};

// Season and climate are worked out from the dates and the weather, not asked for
export const SEASONS = ['spring', 'summer', 'fall', 'winter'] as const;
export const ACCOMMODATIONS = ['hotel', 'hostel', 'camping', 'airbnb', 'other'] as const;
export const CATEGORIES = ['clothing', 'toiletries', 'electronics', 'documents', 'accessories', 'other'] as const;

export const MAX_GROUP_SIZE = 20;
export const MAX_DURATION_DAYS = 365;
export const MAX_QUANTITY = 99;
export const MAX_DAYS_AHEAD = 730;
