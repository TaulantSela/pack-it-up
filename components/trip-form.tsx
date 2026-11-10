'use client';

import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import FormField from '@/components/ui/form-field';
import Input from '@/components/ui/Input';
import PlaceInput from '@/components/ui/PlaceInput';
import Select from '@/components/ui/Select';
import { tripLength } from '@/lib/dates';
import {
  ACCOMMODATIONS,
  ACTIVITIES,
  MAX_DURATION_DAYS,
  MAX_GROUP_SIZE,
  TRANSPORT_LABELS,
  TRANSPORTS,
} from '@/lib/trip-options';
import { Place, TripDetails } from '@/lib/types';
import { pluralize } from '@/lib/utils';
import { Baby, Calendar, Car, Home, MapPin, MessageSquare, Navigation, Plane, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

interface TripFormProps {
  onSubmit: (details: TripDetails) => void;
  isLoading: boolean;
  isGuest?: boolean;
  disabled?: boolean;
}

const ORIGIN_STORAGE_KEY = 'pack-it-up-origin';

const transportOptions = TRANSPORTS.map((value) => ({ value, label: TRANSPORT_LABELS[value] }));

// The date inputs work in the traveler's own time zone
const localToday = () => new Date().toLocaleDateString('en-CA');

const parseWholeNumber = (value: string) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
};

export default function TripForm({ onSubmit, isLoading, isGuest = false, disabled = false }: TripFormProps) {
  const [formData, setFormData] = useState<Partial<TripDetails>>({
    origin: '',
    destination: '',
    startDate: '',
    endDate: '',
    activities: [],
    accommodation: 'hotel',
    groupSize: 1,
    includesChildren: false,
    specialNeeds: [],
  });

  const [specialNeed, setSpecialNeed] = useState('');

  // Most trips start from the same place, so remember it between visits
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(ORIGIN_STORAGE_KEY);
      if (!saved) return;
      // Older visits saved plain text, newer ones also save the picked place
      let origin = saved;
      let originPlace: Place | undefined;
      try {
        const parsed = JSON.parse(saved) as { origin?: string; place?: Place };
        if (parsed.origin) {
          origin = parsed.origin;
          originPlace = parsed.place;
        }
      } catch {
        // Plain text from an older visit
      }
      setFormData((prev) => (prev.origin ? prev : { ...prev, origin, originPlace }));
    } catch {
      // Storage can be unavailable in private windows
    }
  }, []);

  const datesValid = Boolean(formData.startDate && formData.endDate && formData.endDate >= formData.startDate);
  const days = datesValid ? tripLength(formData.startDate!, formData.endDate!) : null;

  const missingFields = [
    !formData.origin?.trim() && 'your home city',
    !formData.destination?.trim() && 'a destination',
    !datesValid && 'your travel dates',
    !formData.transport && 'how you’re getting there',
    !formData.groupSize && 'the group size',
    !formData.activities?.length && 'at least one activity',
  ].filter(Boolean) as string[];

  const handleStartDateChange = (startDate: string) => {
    // Keep the end date on or after the start date
    setFormData((prev) => ({
      ...prev,
      startDate,
      endDate: !prev.endDate || prev.endDate < startDate ? startDate : prev.endDate,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (missingFields.length || disabled || (days !== null && days > MAX_DURATION_DAYS)) {
      return;
    }
    try {
      window.localStorage.setItem(
        ORIGIN_STORAGE_KEY,
        JSON.stringify({ origin: formData.origin!.trim(), place: formData.originPlace }),
      );
    } catch {
      // Remembering the origin is a convenience only
    }
    onSubmit({
      ...(formData as TripDetails),
      origin: formData.origin!.trim(),
      destination: formData.destination!.trim(),
    });
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

  const submitLabel = isLoading ? 'Generating...' : isGuest ? 'Preview Packing List' : 'Generate Packing List';

  const formatList = (parts: string[]) =>
    parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}` : parts[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <PlaceInput
            icon={{ name: Navigation }}
            label="Home city"
            value={formData.origin ?? ''}
            onChange={(origin, originPlace) => setFormData((prev) => ({ ...prev, origin, originPlace }))}
            placeholder="e.g., Struga, North Macedonia"
            describedBy="origin-hint"
          />
          <p id="origin-hint" className="mt-1 text-xs text-gray-600 dark:text-gray-300">
            Where you live, even if you fly out from somewhere else.
          </p>
        </div>
        <PlaceInput
          icon={{ name: MapPin }}
          label="Destination"
          value={formData.destination ?? ''}
          onChange={(destination, destinationPlace) =>
            setFormData((prev) => ({ ...prev, destination, destinationPlace }))
          }
          placeholder="e.g., Paris, France"
        />
        <Input
          icon={{ name: Calendar }}
          label={{ name: 'Start date' }}
          type="date"
          min={localToday()}
          value={formData.startDate ?? ''}
          onChange={(e) => handleStartDateChange(e.target.value)}
          required
        />
        <div>
          <Input
            icon={{ name: Calendar }}
            label={{ name: 'End date' }}
            type="date"
            min={formData.startDate || localToday()}
            value={formData.endDate ?? ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
            aria-describedby="dates-hint"
            required
          />
          <p id="dates-hint" className="mt-1 text-xs text-gray-600 dark:text-gray-300">
            {days !== null
              ? `${pluralize(days, 'day')}. We check the forecast, or the typical weather for later dates.`
              : 'We check the forecast, or the typical weather for later dates.'}
          </p>
        </div>
        <Select
          icon={{ name: Car }}
          label={{ name: 'Getting there' }}
          value={formData.transport ?? ''}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, transport: (e.target.value || undefined) as TripDetails['transport'] }))
          }
          options={transportOptions}
          placeholder="Choose how you travel"
          required
        />
        <Input
          icon={{ name: Users }}
          label={{ name: 'Group Size' }}
          type="number"
          min="1"
          max={MAX_GROUP_SIZE}
          value={formData.groupSize ?? ''}
          onChange={(e) => setFormData((prev) => ({ ...prev, groupSize: parseWholeNumber(e.target.value) }))}
          required
        />
        <Select
          icon={{ name: Home }}
          label={{ name: 'Accommodation' }}
          value={formData.accommodation}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, accommodation: e.target.value as TripDetails['accommodation'] }))
          }
          options={[...ACCOMMODATIONS]}
          required
        />
      </div>

      {/* Activities */}

      <FormField icon={{ name: Plane }} label={{ name: 'Activities (select all that apply)', className: 'mb-4' }}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {ACTIVITIES.map((activity, index) => (
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

      {/* Anything else */}

      <div>
        <FormField icon={{ name: MessageSquare }} label={{ name: 'Anything else? (optional)' }}>
          <div className="mb-3 flex space-x-2">
            <Input
              value={specialNeed}
              onChange={(e) => setSpecialNeed(e.target.value)}
              className="flex-1"
              placeholder="e.g., wedding on day 2, gluten-free, work laptop"
              maxLength={150}
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
      <div className="space-y-3 text-center">
        {isGuest && (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            You&apos;re previewing Pack It Up. Sign in to save your lists, track progress, and access history later.
          </p>
        )}
        <Button
          type="submit"
          disabled={isLoading || disabled || missingFields.length > 0}
          className="btn-primary px-8 py-3 text-lg disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitLabel}
        </Button>
        {missingFields.length > 0 && (
          <p className="text-sm text-gray-600 dark:text-gray-300">To continue, add {formatList(missingFields)}.</p>
        )}
      </div>
    </form>
  );
}
