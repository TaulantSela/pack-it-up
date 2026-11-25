import { z } from 'zod';
import { addDays, todayDateString, tripLength } from './dates';
import {
  ACCOMMODATIONS,
  ACTIVITIES,
  MAX_DAYS_AHEAD,
  MAX_DURATION_DAYS,
  MAX_GROUP_SIZE,
  MAX_QUANTITY,
  MAX_TRAVELER_NAME,
  SEASONS,
  TRANSPORTS,
} from './trip-options';

const dateString = z.iso.date();

const placeSchema = z.object({
  label: z.string().trim().min(1).max(150),
  region: z.string().trim().max(100).optional(),
  countryCode: z
    .string()
    .regex(/^[A-Za-z]{2}$/)
    .optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const tripDetailsSchema = z
  .object({
    origin: z.string().trim().min(1).max(100),
    originPlace: placeSchema.optional(),
    destination: z.string().trim().min(1).max(100),
    destinationPlace: placeSchema.optional(),
    startDate: dateString,
    endDate: dateString,
    transport: z.enum(TRANSPORTS),
    activities: z.array(z.enum(ACTIVITIES)).min(1).max(ACTIVITIES.length),
    accommodation: z.enum(ACCOMMODATIONS),
    groupSize: z.number().int().min(1).max(MAX_GROUP_SIZE),
    travelers: z.array(z.string().trim().max(MAX_TRAVELER_NAME)).max(MAX_GROUP_SIZE).optional(),
    includesChildren: z.boolean(),
    specialNeeds: z.array(z.string().trim().min(1).max(150)).max(10),
  })
  .refine((trip) => trip.endDate >= trip.startDate, { message: 'The trip ends before it starts', path: ['endDate'] })
  .refine((trip) => tripLength(trip.startDate, trip.endDate) <= MAX_DURATION_DAYS, {
    message: 'Trips can be up to a year long',
    path: ['endDate'],
  })
  // Allow yesterday so time zones ahead of UTC can still pick today
  .refine(
    (trip) =>
      trip.startDate >= addDays(todayDateString(), -1) && trip.startDate <= addDays(todayDateString(), MAX_DAYS_AHEAD),
    { message: 'Pick a start date between today and two years from now', path: ['startDate'] },
  );

export const quantitySchema = z.number().int().min(1).max(MAX_QUANTITY);

export const packingItemInputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  category: z.string().trim().toLowerCase().min(1).max(50),
  essential: z.boolean().default(false),
  quantity: quantitySchema.default(1),
  notes: z.string().trim().max(300).nullish(),
});

const temperature = z.number().min(-90).max(60);
const dayCount = z.number().int().min(0).max(MAX_DURATION_DAYS + 1);

const weatherSummarySchema = z.object({
  place: z.string().max(150),
  kind: z.enum(['forecast', 'typical']),
  days: dayCount,
  avgHigh: temperature,
  avgLow: temperature,
  maxHigh: temperature,
  minLow: temperature,
  rainyDays: dayCount,
  snowyDays: dayCount,
});

// Index of the traveler who ticked an item; shared items and older trips use 0
const personSchema = z.number().int().min(0).max(MAX_GROUP_SIZE - 1);

export const guestTripMigrationSchema = z.object({
  items: z
    .array(packingItemInputSchema.extend({ id: z.string().max(100), aiSuggested: z.boolean().optional() }))
    .min(1)
    .max(200),
  progress: z
    .array(z.object({ itemId: z.string().max(100), person: personSchema.default(0), checked: z.boolean() }))
    .max(200 * MAX_GROUP_SIZE)
    .default([]),
  // The guest trip's weather and season, so moving it to an account doesn't look them up again.
  // Anything off is dropped, and the server looks them up as before
  context: z
    .object({ weather: weatherSummarySchema.nullable(), season: z.enum(SEASONS) })
    .optional()
    .catch(undefined),
});

export const progressUpdateSchema = z.object({
  itemId: z.string().min(1).max(100),
  // The travelers whose tick changes; ticking an item for everyone sends them all
  persons: z.array(personSchema).min(1).max(MAX_GROUP_SIZE).default([0]),
  checked: z.boolean(),
});
