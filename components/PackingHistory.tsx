'use client';

import { Calendar, Clock, Copy, Eye, History, MapPin, Trash2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Trip {
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
  items: any[];
  progress: any[];
}

interface PackingHistoryProps {
  onLoadList: (trip: Trip) => void;
  onDeleteTrip: (tripId: string) => Promise<void>;
  onClose: () => void;
}

export default function PackingHistory({ onLoadList, onDeleteTrip, onClose }: PackingHistoryProps) {
  const [history, setHistory] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await fetch('/api/trips');
        if (response.ok) {
          const data = await response.json();
          setHistory(data.trips);
        }
      } catch (error) {
        console.error('Error loading history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await onDeleteTrip(id);
      setHistory((prev) => prev.filter((list) => list.id !== id));
    } catch (error) {
      console.error('Error deleting trip:', error);
    }
  };

  const handleLoad = (trip: Trip) => {
    onLoadList(trip);
    onClose();
  };

  const handleDuplicate = async (trip: Trip) => {
    try {
      // Create a new trip with the same details
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tripDetails: {
            destination: trip.destination,
            duration: trip.duration,
            season: trip.season,
            climate: trip.climate,
            activities: JSON.parse(trip.activities),
            accommodation: trip.accommodation,
            groupSize: trip.groupSize,
            includesChildren: trip.includesChildren,
            specialNeeds: JSON.parse(trip.specialNeeds),
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setHistory((prev) => [data.trip, ...prev]);
      }
    } catch (error) {
      console.error('Error duplicating trip:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="rounded-lg bg-white p-8">
          <div className="border-primary-600 mx-auto h-8 w-8 animate-spin rounded-full border-b-2"></div>
          <p className="mt-4 text-gray-600">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <History className="text-primary-600 h-6 w-6" />
              <h2 className="text-2xl font-semibold text-gray-900">Packing List History</h2>
            </div>
            <button onClick={onClose} className="text-gray-400 transition-colors hover:text-gray-600">
              ✕
            </button>
          </div>
        </div>

        <div className="max-h-[calc(90vh-120px)] overflow-y-auto p-6">
          {history.length === 0 ? (
            <div className="py-12 text-center">
              <History className="mx-auto mb-4 h-16 w-16 text-gray-300" />
              <h3 className="mb-2 text-lg font-medium text-gray-900">No History Yet</h3>
              <p className="text-gray-600">Your packing lists will appear here once you create them.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((trip) => (
                <div
                  key={trip.id}
                  className="rounded-lg border border-gray-200 p-4 transition-colors hover:border-gray-300"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="mb-2 font-semibold text-gray-900">{trip.name}</h3>

                      <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span>{trip.destination}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>{trip.duration} days</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Users className="h-4 w-4" />
                          <span>{trip.groupSize} people</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>Created: {formatDate(trip.createdAt)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span>•</span>
                          <span>{trip.items.length} items</span>
                        </div>
                      </div>
                    </div>

                    <div className="ml-4 flex items-center space-x-2">
                      <button
                        onClick={() => handleLoad(trip)}
                        className="btn-primary px-3 py-1 text-sm"
                        title="Load this list"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDuplicate(trip)}
                        className="btn-secondary px-3 py-1 text-sm"
                        title="Duplicate this list"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(trip.id)}
                        className="px-3 py-1 text-sm text-red-600 transition-colors hover:text-red-800"
                        title="Delete this list"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
