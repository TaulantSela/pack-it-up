'use client';

import { IconI, Place } from '@/lib/types';
import { cn } from '@/lib/utils';
import { searchPlaces } from '@/lib/weather';
import type { KeyboardEvent } from 'react';
import { useEffect, useId, useState } from 'react';

interface PlaceInputProps {
  icon?: IconI;
  label: string;
  value: string;
  onChange: (value: string, place?: Place) => void;
  placeholder?: string;
  describedBy?: string;
}

const SEARCH_DELAY_MS = 250;
const MAX_SUGGESTIONS = 6;

// "FR" -> 🇫🇷
const flagFor = (countryCode?: string) =>
  countryCode
    ? countryCode.toUpperCase().replace(/./g, (letter) => String.fromCodePoint(127397 + letter.charCodeAt(0)))
    : '';

// Suggests places as the user types. Picking one pins the exact place, but free text is still accepted.
export default function PlaceInput({ icon, label, value, onChange, placeholder, describedBy }: PlaceInputProps) {
  const inputId = useId();
  const listId = useId();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const Icon = icon?.name;

  useEffect(() => {
    // Drop suggestions for the previous text, so Enter can't pick a stale one
    setResults([]);
    setActiveIndex(-1);

    if (query.trim().length < 2) {
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const places = await searchPlaces(query, controller.signal);
        setResults(places.slice(0, MAX_SUGGESTIONS));
        setActiveIndex(-1);
      } catch {
        // Suggestions are a convenience, typing a place still works without them
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setIsSearching(false);
      }
    }, SEARCH_DELAY_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const selectPlace = (place: Place) => {
    onChange(place.label, place);
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      return;
    }
    if (!isOpen || !results.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? results.length - 1 : index - 1));
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      selectPlace(results[activeIndex]);
    }
  };

  const showList = isOpen && query.trim().length >= 2;

  return (
    <div>
      <label htmlFor={inputId} className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-100">
        {Icon && <Icon className={cn('mr-2 inline h-4 w-4', icon?.className)} />}
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={listId}
          aria-activedescendant={showList && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
          aria-describedby={describedBy}
          autoComplete="off"
          className="input-field"
          value={value}
          placeholder={placeholder}
          maxLength={100}
          required
          onChange={(event) => {
            // Typing replaces any place picked earlier
            onChange(event.target.value, undefined);
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(results.length > 0)}
          onBlur={() => setIsOpen(false)}
          onKeyDown={handleKeyDown}
        />
        {showList && (
          <ul
            id={listId}
            role="listbox"
            // Keep focus in the input so clicking an option doesn't close the list first
            onMouseDown={(event) => event.preventDefault()}
            className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-600 dark:bg-gray-800"
          >
            {results.map((place, index) => (
              <li
                key={`${place.label}-${place.region}-${place.latitude}`}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                onClick={() => selectPlace(place)}
                className={cn(
                  'flex cursor-pointer items-center gap-2 px-3 py-2 text-sm',
                  index === activeIndex
                    ? 'bg-primary-50 dark:bg-gray-700'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/60',
                )}
              >
                <span aria-hidden="true">{flagFor(place.countryCode)}</span>
                <span className="text-gray-900 dark:text-white">{place.label}</span>
                {place.region && <span className="truncate text-gray-500 dark:text-gray-400">{place.region}</span>}
              </li>
            ))}
            {!results.length && (
              <li className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                {isSearching ? 'Searching…' : 'No matches. You can keep what you typed.'}
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
