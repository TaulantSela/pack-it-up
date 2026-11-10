import { z } from 'zod';
import {
  ACCOMMODATIONS,
  ACTIVITIES,
  CLIMATES,
  MAX_DURATION_DAYS,
  MAX_GROUP_SIZE,
  MAX_QUANTITY,
  SEASONS,
} from './trip-options';

export const tripDetailsSchema = z.object({
  origin: z.string().trim().min(1).max(100),
  destination: z.string().trim().min(1).max(100),
  duration: z.number().int().min(1).max(MAX_DURATION_DAYS),
  season: z.enum(SEASONS),
  climate: z.enum(CLIMATES),
  activities: z.array(z.enum(ACTIVITIES)).min(1).max(ACTIVITIES.length),
  accommodation: z.enum(ACCOMMODATIONS),
  groupSize: z.number().int().min(1).max(MAX_GROUP_SIZE),
  includesChildren: z.boolean(),
  specialNeeds: z.array(z.string().trim().min(1).max(100)).max(10),
});

export const quantitySchema = z.number().int().min(1).max(MAX_QUANTITY);

export const packingItemInputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  category: z.string().trim().toLowerCase().min(1).max(50),
  essential: z.boolean().default(false),
  quantity: quantitySchema.default(1),
  notes: z.string().trim().max(300).nullish(),
});

export const guestTripMigrationSchema = z.object({
  items: z
    .array(packingItemInputSchema.extend({ id: z.string().max(100), aiSuggested: z.boolean().optional() }))
    .min(1)
    .max(200),
  progress: z
    .array(z.object({ itemId: z.string().max(100), checked: z.boolean() }))
    .max(200)
    .default([]),
});

export const progressUpdateSchema = z.object({
  itemId: z.string().min(1).max(100),
  checked: z.boolean(),
});
