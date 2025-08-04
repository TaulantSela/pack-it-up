'use client';

import { useState } from 'react';
import { TripDetails, PackingItem } from '@/lib/types';
import TripForm from '@/components/TripForm';
import PackingList from '@/components/PackingList';
import PackingHistory from '@/components/PackingHistory';
import { Luggage, MapPin, Users, Calendar, History } from 'lucide-react';

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
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Luggage className="w-12 h-12 text-primary-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Pack It Up</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Generate personalized packing lists based on your destination, activities, and travel preferences
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          {!currentTrip ? (
            <div className="card max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Tell us about your trip
                </h2>
                <p className="text-gray-600">
                  Fill out the form below to get your personalized packing list
                </p>
              </div>
              
              {/* History Button */}
              <div className="text-center mb-6">
                <button
                  onClick={() => setShowHistory(true)}
                  className="btn-secondary flex items-center space-x-2 mx-auto"
                >
                  <History className="w-4 h-4" />
                  <span>View Previous Lists</span>
                </button>
              </div>
              
              <TripForm onSubmit={handleGenerateList} isLoading={isLoading} />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Trip Summary */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-semibold text-gray-900">Your Trip</h2>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setShowHistory(true)}
                      className="btn-secondary flex items-center space-x-2"
                    >
                      <History className="w-4 h-4" />
                      <span>History</span>
                    </button>
                    <button
                      onClick={() => setCurrentTrip(null)}
                      className="btn-secondary"
                    >
                      Start Over
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-5 h-5 text-primary-600" />
                    <span className="text-gray-700">
                      <strong>Destination:</strong> {currentTrip.destination}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-primary-600" />
                    <span className="text-gray-700">
                      <strong>Duration:</strong> {currentTrip.duration} days
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-primary-600" />
                    <span className="text-gray-700">
                      <strong>Group Size:</strong> {currentTrip.groupSize} people
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Luggage className="w-5 h-5 text-primary-600" />
                    <span className="text-gray-700">
                      <strong>Climate:</strong> {currentTrip.climate}
                    </span>
                  </div>
                </div>
              </div>

              {/* Packing List */}
              <PackingList 
                items={currentTrip.items} 
                tripId={currentTrip.id}
              />
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