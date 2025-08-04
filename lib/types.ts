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
}

export interface PackingList {
  id: string;
  tripDetails: TripDetails;
  items: PackingItem[];
  createdAt: Date;
} 