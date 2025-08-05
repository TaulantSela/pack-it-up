'use client';

import { TripDetails } from '@/lib/types';
import { AlertCircle, Baby, Calendar, Cloud, Home, MapPin, Plane, Users } from 'lucide-react';
import { useState } from 'react';

interface TripFormProps {
  onSubmit: (details: TripDetails) => void;
  isLoading: boolean;
}

const activities = [
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
];

const seasons = ['spring', 'summer', 'fall', 'winter'] as const;
const climates = ['tropical', 'temperate', 'cold', 'desert'] as const;
const accommodations = ['hotel', 'hostel', 'camping', 'airbnb', 'other'] as const;

export default function TripForm({ onSubmit, isLoading }: TripFormProps) {
  const [formData, setFormData] = useState<Partial<TripDetails>>({
    destination: '',
    duration: 1,
    season: 'summer',
    climate: 'temperate',
    activities: [],
    accommodation: 'hotel',
    groupSize: 1,
    includesChildren: false,
    specialNeeds: [],
  });

  const [specialNeed, setSpecialNeed] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      formData.destination &&
      formData.duration &&
      formData.season &&
      formData.climate &&
      formData.activities &&
      formData.accommodation &&
      formData.groupSize !== undefined &&
      formData.includesChildren !== undefined
    ) {
      onSubmit(formData as TripDetails);
    }
  };

  const handleActivityToggle = (activity: string) => {
    setFormData((prev) => ({
      ...prev,
      activities: prev.activities?.includes(activity)
        ? prev.activities.filter((a) => a !== activity)
        : [...(prev.activities || []), activity],
    }));
  };

  const handleSpecialNeedAdd = () => {
    if (specialNeed.trim() && !formData.specialNeeds?.includes(specialNeed.trim())) {
      setFormData((prev) => ({
        ...prev,
        specialNeeds: [...(prev.specialNeeds || []), specialNeed.trim()],
      }));
      setSpecialNeed('');
    }
  };

  const handleSpecialNeedRemove = (need: string) => {
    setFormData((prev) => ({
      ...prev,
      specialNeeds: prev.specialNeeds?.filter((n) => n !== need) || [],
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            <MapPin className="mr-2 inline h-4 w-4" />
            Destination
          </label>
          <input
            type="text"
            value={formData.destination}
            onChange={(e) => setFormData((prev) => ({ ...prev, destination: e.target.value }))}
            className="input-field"
            placeholder="e.g., Paris, France"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            <Calendar className="mr-2 inline h-4 w-4" />
            Duration (days)
          </label>
          <input
            type="number"
            min="1"
            max="365"
            value={formData.duration}
            onChange={(e) => setFormData((prev) => ({ ...prev, duration: parseInt(e.target.value) }))}
            className="input-field"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            <Cloud className="mr-2 inline h-4 w-4" />
            Season
          </label>
          <select
            value={formData.season}
            onChange={(e) => setFormData((prev) => ({ ...prev, season: e.target.value as any }))}
            className="input-field"
            required
          >
            {seasons.map((season) => (
              <option key={season} value={season}>
                {season.charAt(0).toUpperCase() + season.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            <Cloud className="mr-2 inline h-4 w-4" />
            Climate
          </label>
          <select
            value={formData.climate}
            onChange={(e) => setFormData((prev) => ({ ...prev, climate: e.target.value as any }))}
            className="input-field"
            required
          >
            {climates.map((climate) => (
              <option key={climate} value={climate}>
                {climate.charAt(0).toUpperCase() + climate.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            <Users className="mr-2 inline h-4 w-4" />
            Group Size
          </label>
          <input
            type="number"
            min="1"
            max="20"
            value={formData.groupSize}
            onChange={(e) => setFormData((prev) => ({ ...prev, groupSize: parseInt(e.target.value) }))}
            className="input-field"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            <Home className="mr-2 inline h-4 w-4" />
            Accommodation
          </label>
          <select
            value={formData.accommodation}
            onChange={(e) => setFormData((prev) => ({ ...prev, accommodation: e.target.value as any }))}
            className="input-field"
            required
          >
            {accommodations.map((acc) => (
              <option key={acc} value={acc}>
                {acc.charAt(0).toUpperCase() + acc.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Activities */}
      <div>
        <label className="mb-4 block text-sm font-medium text-gray-700">
          <Plane className="mr-2 inline h-4 w-4" />
          Activities (select all that apply)
        </label>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {activities.map((activity) => (
            <label key={activity} className="flex cursor-pointer items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.activities?.includes(activity)}
                onChange={() => handleActivityToggle(activity)}
                className="text-primary-600 focus:ring-primary-500 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700 capitalize">{activity}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Children */}
      <div>
        <label className="flex cursor-pointer items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.includesChildren}
            onChange={(e) => setFormData((prev) => ({ ...prev, includesChildren: e.target.checked }))}
            className="text-primary-600 focus:ring-primary-500 rounded border-gray-300"
          />
          <Baby className="h-4 w-4" />
          <span className="text-sm font-medium text-gray-700">Traveling with children</span>
        </label>
      </div>

      {/* Special Needs */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          <AlertCircle className="mr-2 inline h-4 w-4" />
          Special Needs (optional)
        </label>
        <div className="mb-3 flex space-x-2">
          <input
            type="text"
            value={specialNeed}
            onChange={(e) => setSpecialNeed(e.target.value)}
            className="input-field flex-1"
            placeholder="e.g., medical conditions, dietary restrictions"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleSpecialNeedAdd())}
          />
          <button type="button" onClick={handleSpecialNeedAdd} className="btn-primary">
            Add
          </button>
        </div>
        {formData.specialNeeds && formData.specialNeeds.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.specialNeeds.map((need, index) => (
              <span
                key={index}
                className="bg-primary-100 text-primary-800 inline-flex items-center rounded-full px-3 py-1 text-sm"
              >
                {need}
                <button
                  type="button"
                  onClick={() => handleSpecialNeedRemove(need)}
                  className="text-primary-600 hover:text-primary-800 ml-2"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="text-center">
        <button
          type="submit"
          disabled={isLoading || !formData.destination || !formData.activities?.length}
          className="btn-primary px-8 py-3 text-lg disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? 'Generating...' : 'Generate Packing List'}
        </button>
      </div>
    </form>
  );
}
