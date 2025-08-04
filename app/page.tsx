'use client';

import { useState } from 'react';
import { TripDetails, PackingItem } from '@/lib/types';
import { generatePackingList } from '@/lib/packingLogic';
import TripForm from '@/components/TripForm';
import PackingList from '@/components/PackingList';
import { Luggage, MapPin, Users, Calendar } from 'lucide-react';

export default function Home() {
  const [packingList, setPackingList] = useState<PackingItem[]>([]);
  const [tripDetails, setTripDetails] = useState<TripDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateList = async (details: TripDetails) => {
    setIsLoading(true);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const items = generatePackingList(details);
    setPackingList(items);
    setTripDetails(details);
    setIsLoading(false);
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
          {packingList.length === 0 ? (
            <div className="card max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Tell us about your trip
                </h2>
                <p className="text-gray-600">
                  Fill out the form below to get your personalized packing list
                </p>
              </div>
              <TripForm onSubmit={handleGenerateList} isLoading={isLoading} />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Trip Summary */}
              {tripDetails && (
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-semibold text-gray-900">Your Trip</h2>
                    <button
                      onClick={() => {
                        setPackingList([]);
                        setTripDetails(null);
                      }}
                      className="btn-secondary"
                    >
                      Start Over
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-5 h-5 text-primary-600" />
                      <span className="text-gray-700">
                        <strong>Destination:</strong> {tripDetails.destination}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-5 h-5 text-primary-600" />
                      <span className="text-gray-700">
                        <strong>Duration:</strong> {tripDetails.duration} days
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-5 h-5 text-primary-600" />
                      <span className="text-gray-700">
                        <strong>Group Size:</strong> {tripDetails.groupSize} people
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Luggage className="w-5 h-5 text-primary-600" />
                      <span className="text-gray-700">
                        <strong>Climate:</strong> {tripDetails.climate}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Packing List */}
              <PackingList items={packingList} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 