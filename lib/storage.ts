import { PackingList } from './types';

const STORAGE_KEY = 'pack-it-up-history';

export interface SavedPackingList extends PackingList {
  id: string;
  name: string;
  createdAt: Date;
  lastModified: Date;
}

export function savePackingList(tripDetails: any, items: any[]): SavedPackingList {
  const savedList: SavedPackingList = {
    id: generateId(),
    name: `${tripDetails.destination} - ${tripDetails.duration} days`,
    tripDetails,
    items,
    createdAt: new Date(),
    lastModified: new Date(),
  };

  const history = getPackingListHistory();
  history.unshift(savedList);
  
  // Keep only the last 20 lists
  const limitedHistory = history.slice(0, 20);
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedHistory));
  return savedList;
}

export function getPackingListHistory(): SavedPackingList[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const history = JSON.parse(stored);
    return history.map((item: any) => ({
      ...item,
      createdAt: new Date(item.createdAt),
      lastModified: new Date(item.lastModified),
    }));
  } catch (error) {
    console.error('Error loading packing list history:', error);
    return [];
  }
}

export function deletePackingList(id: string): void {
  const history = getPackingListHistory();
  const filteredHistory = history.filter(list => list.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredHistory));
}

export function updatePackingList(id: string, updates: Partial<SavedPackingList>): void {
  const history = getPackingListHistory();
  const updatedHistory = history.map(list => 
    list.id === id 
      ? { ...list, ...updates, lastModified: new Date() }
      : list
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
} 