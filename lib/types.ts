import { ComponentType } from 'react';

export interface TripDetails {
  destination: string;
  duration: number;
  season: 'spring' | 'summer' | 'fall' | 'winter';
  climate: 'tropical' | 'temperate' | 'cold' | 'desert';
  activities: string[];
  accommodation: 'hotel' | 'hostel' | 'camping' | 'airbnb' | 'other';
  groupSize: number;
  includesChildren: boolean;
  specialNeeds: string[];
}

export interface PackingItem {
  id: string;
  name: string;
  category: 'clothing' | 'toiletries' | 'electronics' | 'documents' | 'accessories' | 'other';
  essential: boolean;
  quantity: number;
  notes?: string;
  aiSuggested?: boolean;
}

export interface PackingList {
  id: string;
  tripDetails: TripDetails;
  items: PackingItem[];
  createdAt: Date;
}

export interface IconI {
  name: ComponentType<{ className?: string }>;
  className?: string;
}
export interface LabelI {
  name: string;
  className?: string;
}
