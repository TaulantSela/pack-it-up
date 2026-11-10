'use client';

import PackingHistory from '@/components/packing-history';
import PackingList from '@/components/packing-list';
import { ThemeToggle } from '@/components/theme-toggle';
import TripForm from '@/components/trip-form';
import { formatDateRange } from '@/lib/dates';
import { clearGuestTripSession, loadGuestTripSession, saveGuestTripSession } from '@/lib/session-storage';
import { TRANSPORT_LABELS } from '@/lib/trip-options';
import { PackingItem, Transport, TripDetails, WeatherSummary } from '@/lib/types';
import { pluralize } from '@/lib/utils';
import { describeWeather } from '@/lib/weather';
import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs';
import { Calendar, CloudSun, History, Info, Luggage, MapPin, Users, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Trip {
  id: string;
  name: string;
  origin?: string | null;
  destination: string;
  startDate?: string | null;
  endDate?: string | null;
  transport?: string | null;
  weather?: string | null;
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
  progress?: { itemId: string; checked: boolean }[];
  userId?: string | null;
  source?: 'ai' | 'fallback';
}

function parseWeather(value?: string | null): WeatherSummary | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as WeatherSummary;
  } catch {
    return null;
  }
}

export default function Home() {
  const { isSignedIn, user, isLoaded } = useUser();
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [authPromptVisible, setAuthPromptVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasMigratedSession = useRef(false);
  const previousSignedIn = useRef(isSignedIn);
  const [guestTripDetails, setGuestTripDetails] = useState<TripDetails | null>(null);

  const handleGenerateList = async (details: TripDetails) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tripDetails: details, guestMode: !isSignedIn }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create trip. Please try again.');
      }

      const normalizedTrip = { ...data.trip, progress: data.trip.progress ?? [], source: data.source };
      setCurrentTrip(normalizedTrip);
      hasMigratedSession.current = false;
      if (!isSignedIn) {
        setAuthPromptVisible(true);
        setGuestTripDetails(details);
        saveGuestTripSession({
          trip: normalizedTrip,
          tripDetails: details,
          savedAt: new Date().toISOString(),
        });
      } else {
        clearGuestTripSession();
        setGuestTripDetails(null);
      }
    } catch (error) {
      console.error('Error creating trip:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create trip. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadFromHistory = (trip: Trip) => {
    if (!isSignedIn) {
      setAuthPromptVisible(true);
      return;
    }
    setCurrentTrip(trip);
  };

  // Throws on failure so the history modal keeps the trip and shows the error
  const handleDeleteTrip = async (tripId: string) => {
    if (!isSignedIn) {
      setAuthPromptVisible(true);
      return;
    }

    const response = await fetch(`/api/trips/${tripId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete trip. Please try again.');
    }

    // If we're deleting the current trip, clear it
    if (currentTrip?.id === tripId) {
      setCurrentTrip(null);
    }
  };

  const handleStartOver = () => {
    setCurrentTrip(null);
    setErrorMessage(null);
    if (!isSignedIn) {
      clearGuestTripSession();
      setGuestTripDetails(null);
    }
  };

  const handleGuestToggleItem = (itemId: string, checked: boolean) => {
    if (isSignedIn) {
      return;
    }

    const existingSession = loadGuestTripSession();

    setCurrentTrip((previous) => {
      if (!previous) {
        return previous;
      }

      const existingProgress = previous.progress ?? [];
      const remaining = existingProgress.filter((entry) => entry.itemId !== itemId);
      const nextProgress = checked ? [...remaining, { itemId, checked: true }] : remaining;
      const nextTrip = { ...previous, progress: nextProgress };

      const tripDetailsForSession = guestTripDetails ?? existingSession?.tripDetails ?? null;

      if (tripDetailsForSession) {
        saveGuestTripSession({
          trip: { ...nextTrip, progress: nextProgress, userId: nextTrip.userId ?? null },
          tripDetails: tripDetailsForSession,
          savedAt: new Date().toISOString(),
        });
      }

      return nextTrip;
    });
  };

  const handleGuestResetProgress = () => {
    const tripDetailsForSession = guestTripDetails ?? loadGuestTripSession()?.tripDetails ?? null;

    setCurrentTrip((previous) => {
      if (!previous) {
        return previous;
      }

      const nextTrip = { ...previous, progress: [] };
      if (tripDetailsForSession) {
        saveGuestTripSession({
          trip: { ...nextTrip, userId: nextTrip.userId ?? null },
          tripDetails: tripDetailsForSession,
          savedAt: new Date().toISOString(),
        });
      }
      return nextTrip;
    });
  };

  useEffect(() => {
    if (isSignedIn) {
      setAuthPromptVisible(false);
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (!isLoaded || isSignedIn) {
      return;
    }
    const saved = loadGuestTripSession();
    if (saved) {
      const normalizedTrip = { ...saved.trip, progress: saved.trip.progress ?? [] };
      setCurrentTrip(normalizedTrip as Trip);
      setGuestTripDetails(saved.tripDetails);
      setAuthPromptVisible(true);
    }
  }, [isLoaded, isSignedIn]);

  const migrateGuestTripToAccount = async () => {
    const saved = loadGuestTripSession();
    if (!saved || hasMigratedSession.current) {
      return;
    }

    try {
      hasMigratedSession.current = true;
      setIsLoading(true);
      setCurrentTrip(null);
      setShowHistory(false);
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tripDetails: saved.tripDetails,
          migrateGuestTrip: {
            items: saved.trip.items.map((item) => ({
              id: item.id,
              name: item.name,
              category: item.category,
              essential: item.essential,
              quantity: item.quantity,
              notes: item.notes ?? null,
              aiSuggested: item.aiSuggested ?? false,
            })),
            progress: (saved.trip.progress ?? []).map((entry) => ({
              itemId: entry.itemId,
              checked: entry.checked,
            })),
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to migrate guest trip');
      }

      clearGuestTripSession();
      setGuestTripDetails(null);
      setAuthPromptVisible(false);
      // Show the saved list right away instead of an empty form
      setCurrentTrip({ ...data.trip, progress: data.trip.progress ?? [] });
    } catch (error) {
      console.error('Error migrating guest trip:', error);
      hasMigratedSession.current = false;
      setErrorMessage('We couldn’t save your guest list to your account. Please generate it again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!previousSignedIn.current && isSignedIn) {
      setCurrentTrip(null);
      setShowHistory(false);
      setAuthPromptVisible(false);
      migrateGuestTripToAccount();
    }

    if (previousSignedIn.current && !isSignedIn) {
      setCurrentTrip(null);
      setShowHistory(false);
      setGuestTripDetails(null);
      clearGuestTripSession();
      hasMigratedSession.current = false;
    }

    previousSignedIn.current = isSignedIn;
  }, [isSignedIn, isLoaded]);

  const isGuest = !isSignedIn;
  const weather = parseWeather(currentTrip?.weather);

  const handleOpenHistory = () => {
    if (!isSignedIn) {
      setAuthPromptVisible(true);
      return;
    }
    setShowHistory(true);
  };

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex min-h-10 flex-col items-end gap-3 sm:flex-row sm:items-center sm:justify-end print:hidden">
          {!isLoaded ? (
            <div className="h-10 w-48 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
          ) : isSignedIn ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-700 dark:text-gray-200">
                Welcome, {user?.firstName || user?.emailAddresses[0].emailAddress}!
              </span>
              <UserButton />
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <SignInButton mode="modal">
                <button className="btn-primary">Sign In</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="btn-secondary">Create Account</button>
              </SignUpButton>
            </div>
          )}
          <ThemeToggle />
        </div>

        {authPromptVisible && (
          <div className="border-primary-300 dark:border-primary-600 dark:bg-primary-900/20 bg-primary-50 text-primary-700 dark:text-primary-100 mb-10 rounded-lg border px-4 py-3 text-sm print:hidden">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p>
                Sign in to save your packing lists, sync progress across devices, and access your history. Guest
                activity resets when you leave.
              </p>
              <button
                onClick={() => setAuthPromptVisible(false)}
                className="btn-secondary px-3 py-1 text-xs sm:text-sm"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div className="mb-12 text-center print:hidden">
          <div className="mb-4 flex items-center justify-center">
            <Luggage className="text-primary-600 dark:text-primary-400 mr-3 h-12 w-12" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Pack It Up</h1>
          </div>
          <p className="mx-auto max-w-2xl text-xl text-gray-700 dark:text-gray-200">
            Generate personalized packing lists based on your destination, activities, and travel preferences
          </p>
          {isLoaded && isGuest && (
            <p className="mx-auto mt-4 max-w-2xl text-sm text-gray-600 dark:text-gray-300">
              You&apos;re exploring Pack It Up in guest mode. Preview the packing list generator, then create an account
              to keep your lists forever.
            </p>
          )}
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mx-auto mb-8 flex max-w-4xl items-start justify-between gap-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200 print:hidden"
          >
            <p>{errorMessage}</p>
            <button onClick={() => setErrorMessage(null)} aria-label="Dismiss error" className="shrink-0">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Main Content */}
        <div className="mx-auto max-w-6xl">
          {!currentTrip ? (
            <div className="card mx-auto max-w-4xl">
              <div className="mb-8 text-center">
                <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">Tell us about your trip</h2>
                <p className="text-gray-700 dark:text-gray-200">
                  Fill out the form below to get your personalized packing list
                </p>
              </div>

              {/* History Button */}
              {isLoaded && (
                <div className="mb-6 text-center">
                  <button onClick={handleOpenHistory} className="btn-secondary mx-auto flex items-center space-x-2">
                    <History className="h-4 w-4" />
                    <span>{isSignedIn ? 'View Previous Lists' : 'Sign in to view history'}</span>
                  </button>
                </div>
              )}

              <TripForm onSubmit={handleGenerateList} isLoading={isLoading} isGuest={isGuest} disabled={!isLoaded} />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Trip Summary */}
              <div className="card">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Your Trip</h2>
                  <div className="flex flex-wrap items-center gap-3 print:hidden">
                    <button onClick={handleOpenHistory} className="btn-secondary flex items-center space-x-2">
                      <History className="h-4 w-4" />
                      <span>History</span>
                    </button>
                    <button onClick={handleStartOver} className="btn-secondary">
                      Start Over
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="flex items-center space-x-2">
                    <MapPin className="text-primary-600 dark:text-primary-400 h-5 w-5 shrink-0" />
                    <span className="text-gray-800 dark:text-gray-100">
                      <strong>Destination:</strong> {currentTrip.destination}
                      {currentTrip.origin && (
                        <span className="block text-sm text-gray-600 dark:text-gray-300">
                          From home in {currentTrip.origin}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="text-primary-600 dark:text-primary-400 h-5 w-5 shrink-0" />
                    <span className="text-gray-800 dark:text-gray-100">
                      {currentTrip.startDate && currentTrip.endDate ? (
                        <>
                          <strong>Dates:</strong> {formatDateRange(currentTrip.startDate, currentTrip.endDate)}
                          <span className="block text-sm text-gray-600 dark:text-gray-300">
                            {pluralize(currentTrip.duration, 'day')}
                          </span>
                        </>
                      ) : (
                        <>
                          <strong>Duration:</strong> {pluralize(currentTrip.duration, 'day')}
                        </>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="text-primary-600 dark:text-primary-400 h-5 w-5 shrink-0" />
                    <span className="text-gray-800 dark:text-gray-100">
                      <strong>Group Size:</strong> {pluralize(currentTrip.groupSize, 'person', 'people')}
                      {currentTrip.transport && (
                        <span className="block text-sm text-gray-600 dark:text-gray-300">
                          {TRANSPORT_LABELS[currentTrip.transport as Transport] ?? currentTrip.transport}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CloudSun className="text-primary-600 dark:text-primary-400 h-5 w-5 shrink-0" />
                    {weather ? (
                      <span className="text-gray-800 dark:text-gray-100">
                        <strong>Weather:</strong> {describeWeather(weather)}
                        <span className="block text-sm text-gray-600 dark:text-gray-300">
                          {weather.kind === 'forecast' ? 'Forecast' : 'Typical for these dates'} ·{' '}
                          <a
                            href="https://open-meteo.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:no-underline"
                          >
                            Open-Meteo
                          </a>
                        </span>
                      </span>
                    ) : currentTrip.startDate ? (
                      <span className="text-gray-800 dark:text-gray-100">
                        <strong>Weather:</strong> Not available
                        <span className="block text-sm text-gray-600 dark:text-gray-300">
                          We couldn&apos;t find {currentTrip.destination}
                        </span>
                      </span>
                    ) : (
                      <span className="text-gray-800 capitalize dark:text-gray-100">
                        <strong>Climate:</strong> {currentTrip.climate}
                      </span>
                    )}
                  </div>
                </div>
                {currentTrip.source === 'fallback' && (
                  <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200 print:hidden">
                    <Info className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>
                      AI suggestions aren&apos;t available right now, so this is our standard list for your trip type.
                      Try again later for a list tailored to {currentTrip.destination}.
                    </p>
                  </div>
                )}
              </div>

              {/* Packing List */}
              <PackingList
                items={currentTrip.items}
                tripId={currentTrip.id}
                isGuest={isGuest}
                onRequireAuth={() => setAuthPromptVisible(true)}
                initialCheckedIds={
                  currentTrip.progress?.filter((entry) => entry.checked).map((entry) => entry.itemId) ?? []
                }
                onGuestToggleItem={isGuest ? handleGuestToggleItem : undefined}
                onGuestResetProgress={isGuest ? handleGuestResetProgress : undefined}
              />
              {isGuest && (
                <div className="border-primary-300 dark:border-primary-600 dark:bg-primary-900/10 text-primary-700 dark:text-primary-200 card bg-primary-50 border text-sm print:hidden">
                  Guest preview only — create an account to save changes, tick items off from any device, and revisit
                  this list whenever you like.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* History Modal */}
      {showHistory && isSignedIn && (
        <PackingHistory
          onLoadList={handleLoadFromHistory}
          onDeleteTrip={handleDeleteTrip}
          onClose={() => setShowHistory(false)}
        />
      )}
    </>
  );
}
