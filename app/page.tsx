'use client';

import PackingHistory from '@/components/packing-history';
import PackingList from '@/components/packing-list';
import TripForm from '@/components/trip-form';
import { PackingItem, TripDetails } from '@/lib/types';
import { Calendar, History, Luggage, MapPin, Users } from 'lucide-react';
import { useState } from 'react';

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
  items: PackingItem[];
  progress: any[];
}

export default function Home() {
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const handleGenerateList = async (details: TripDetails) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tripDetails: details }),
      });

      if (!response.ok) {
        throw new Error('Failed to create trip');
      }

      const data = await response.json();
      setCurrentTrip(data.trip);
    } catch (error) {
      console.error('Error creating trip:', error);
      alert('Failed to create trip. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadFromHistory = (trip: Trip) => {
    setCurrentTrip(trip);
  };

  const handleDeleteTrip = async (tripId: string) => {
    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete trip');
      }

      // If we're deleting the current trip, clear it
      if (currentTrip?.id === tripId) {
        setCurrentTrip(null);
      }
    } catch (error) {
      console.error('Error deleting trip:', error);
      alert('Failed to delete trip. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 flex items-center justify-center">
            <Luggage className="text-primary-600 mr-3 h-12 w-12" />
            <h1 className="text-4xl font-bold text-gray-900">Pack It Up</h1>
          </div>
          <p className="mx-auto max-w-2xl text-xl text-gray-600">
            Generate personalized packing lists based on your destination, activities, and travel preferences
          </p>
        </div>

        {/* Main Content */}
        <div className="mx-auto max-w-6xl">
          {!currentTrip ? (
            <div className="card mx-auto max-w-4xl">
              <div className="mb-8 text-center">
                <h2 className="mb-4 text-2xl font-semibold text-gray-900">Tell us about your trip</h2>
                <p className="text-gray-600">Fill out the form below to get your personalized packing list</p>
              </div>

              {/* History Button */}
              <div className="mb-6 text-center">
                <button
                  onClick={() => setShowHistory(true)}
                  className="btn-secondary mx-auto flex items-center space-x-2"
                >
                  <History className="h-4 w-4" />
                  <span>View Previous Lists</span>
                </button>
              </div>

              <TripForm onSubmit={handleGenerateList} isLoading={isLoading} />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Trip Summary */}
              <div className="card">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-gray-900">Your Trip</h2>
                  <div className="flex items-center space-x-4">
                    <button onClick={() => setShowHistory(true)} className="btn-secondary flex items-center space-x-2">
                      <History className="h-4 w-4" />
                      <span>History</span>
                    </button>
                    <button onClick={() => setCurrentTrip(null)} className="btn-secondary">
                      Start Over
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="flex items-center space-x-2">
                    <MapPin className="text-primary-600 h-5 w-5" />
                    <span className="text-gray-700">
                      <strong>Destination:</strong> {currentTrip.destination}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="text-primary-600 h-5 w-5" />
                    <span className="text-gray-700">
                      <strong>Duration:</strong> {currentTrip.duration} days
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="text-primary-600 h-5 w-5" />
                    <span className="text-gray-700">
                      <strong>Group Size:</strong> {currentTrip.groupSize} people
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Luggage className="text-primary-600 h-5 w-5" />
                    <span className="text-gray-700">
                      <strong>Climate:</strong> {currentTrip.climate}
                    </span>
                  </div>
                </div>
              </div>

              {/* Packing List */}
              <PackingList items={currentTrip.items} tripId={currentTrip.id} />
            </div>
          )}
        </div>
      </div>

      {/* History Modal */}
      {showHistory && (
        <PackingHistory
          onLoadList={handleLoadFromHistory}
          onDeleteTrip={handleDeleteTrip}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}
