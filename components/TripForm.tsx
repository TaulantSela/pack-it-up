'use client';

import { TripDetails } from '@/lib/types';
import { AlertCircle, Baby, Calendar, Cloud, Home, MapPin, Plane, Users } from 'lucide-react';
import { useState } from 'react';
import Button from './ui/Button';
import Checkbox from './ui/Checkbox';
import FormField from './ui/FormField';
import Input from './ui/Input';
import Select from './ui/Select';

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

const seasons = ['spring', 'summer', 'fall', 'winter'];
const climates = ['tropical', 'temperate', 'cold', 'desert'];
const accommodations = ['hotel', 'hostel', 'camping', 'airbnb', 'other'];

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
        <Input
          icon={{ name: MapPin }}
          label={{ name: 'Destination' }}
          value={formData.destination}
          onChange={(e) => setFormData((prev) => ({ ...prev, destination: e.target.value }))}
          placeholder="e.g., Paris, France"
          required
        />
        <Input
          icon={{ name: Calendar }}
          label={{ name: 'Duration (days)' }}
          type="number"
          min="1"
          max="365"
          value={formData.duration}
          onChange={(e) => setFormData((prev) => ({ ...prev, duration: parseInt(e.target.value) }))}
          required
        />
        <Select
          icon={{ name: Cloud }}
          label={{ name: 'Season' }}
          value={formData.season}
          onChange={(e) => setFormData((prev) => ({ ...prev, season: e.target.value as any }))}
          options={seasons}
          required
        />
        <Select
          icon={{ name: Cloud }}
          label={{ name: 'Climate' }}
          value={formData.climate}
          onChange={(e) => setFormData((prev) => ({ ...prev, climate: e.target.value as any }))}
          options={climates}
          required
        />
        <Input
          icon={{ name: Users }}
          label={{ name: 'Group Size' }}
          type="number"
          min="1"
          max="20"
          value={formData.groupSize}
          onChange={(e) => setFormData((prev) => ({ ...prev, groupSize: parseInt(e.target.value) }))}
          required
        />
        <Select
          icon={{ name: Home }}
          label={{ name: 'Accommodation' }}
          value={formData.accommodation}
          onChange={(e) => setFormData((prev) => ({ ...prev, accommodation: e.target.value as any }))}
          options={accommodations}
          required
        />
      </div>

      {/* Activities */}

      <FormField icon={{ name: Plane }} label={{ name: 'Activities (select all that apply)', className: 'mb-4' }}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {activities.map((activity, index) => (
            <Checkbox
              key={index}
              label={{ name: activity, className: 'capitalize' }}
              checked={formData.activities?.includes(activity)}
              onChange={() => handleActivityToggle(activity)}
            />
          ))}
        </div>
      </FormField>

      {/* Children */}
      <div>
        <Checkbox
          icon={{ name: Baby }}
          label={{ name: 'Traveling with children', className: 'font-medium' }}
          checked={formData.includesChildren}
          onChange={(e) => setFormData((prev) => ({ ...prev, includesChildren: e.target.checked }))}
        />
      </div>

      {/* Special Needs */}

      <div>
        <FormField icon={{ name: AlertCircle }} label={{ name: 'Special Needs (optional)' }}>
          <div className="mb-3 flex space-x-2">
            <Input
              value={specialNeed}
              onChange={(e) => setSpecialNeed(e.target.value)}
              className="flex-1"
              placeholder="e.g., medical conditions, dietary restrictions"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleSpecialNeedAdd())}
              withFormField={false}
            />
            <Button onClick={handleSpecialNeedAdd} className="btn-primary">
              Add
            </Button>
          </div>
        </FormField>
        {formData.specialNeeds && formData.specialNeeds.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.specialNeeds.map((need, index) => (
              <span
                key={index}
                className="bg-primary-100 text-primary-800 inline-flex items-center rounded-full px-3 py-1 text-sm"
              >
                {need}
                <Button
                  onClick={() => handleSpecialNeedRemove(need)}
                  className="text-primary-600 hover:text-primary-800 ml-2"
                >
                  x
                </Button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="text-center">
        <Button
          type="submit"
          disabled={isLoading || !formData.destination || !formData.activities?.length}
          className="btn-primary px-8 py-3 text-lg disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? 'Generating...' : 'Generate Packing List'}
        </Button>
      </div>
    </form>
  );
}
