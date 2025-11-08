'use client';

import PackingHistory from '@/components/packing-history';
import PackingList from '@/components/packing-list';
import { ThemeToggle } from '@/components/theme-toggle';
import TripForm from '@/components/trip-form';
import { clearGuestTripSession, loadGuestTripSession, saveGuestTripSession } from '@/lib/session-storage';
import { PackingItem, TripDetails } from '@/lib/types';
import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs';
import { Calendar, History, Luggage, MapPin, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

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
  progress?: { itemId: string; checked: boolean }[];
  userId?: string | null;
}

export default function Home() {
  const { isSignedIn, user, isLoaded } = useUser();
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [authPromptVisible, setAuthPromptVisible] = useState(false);
  const hasMigratedSession = useRef(false);
  const previousSignedIn = useRef(isSignedIn);
  const [guestTripDetails, setGuestTripDetails] = useState<TripDetails | null>(null);

  const handleGenerateList = async (details: TripDetails) => {
    setIsLoading(true);

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
        const errorDetails = data.details ? `\n\nDetails: ${data.details}` : '';
        throw new Error(data.error || 'Failed to create trip' + errorDetails);
      }

      const normalizedTrip = { ...data.trip, progress: data.trip.progress ?? [] };
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to create trip. Please try again.';
      alert(errorMessage);
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

  const handleDeleteTrip = async (tripId: string) => {
    if (!isSignedIn) {
      setAuthPromptVisible(true);
      return;
    }
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

  const handleStartOver = () => {
    setCurrentTrip(null);
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
              aiSuggested: item.aiSuggested ?? true,
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
    } catch (error) {
      console.error('Error migrating guest trip:', error);
      hasMigratedSession.current = false;
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

  // Show loading state while checking authentication
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="border-primary-600 h-12 w-12 animate-spin rounded-full border-b-2"></div>
      </div>
    );
  }

  const isGuest = !isSignedIn;

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
        <div className="mb-8 flex flex-col items-end gap-3 sm:flex-row sm:items-center sm:justify-end">
          {isSignedIn ? (
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
          <div className="border-primary-300 dark:border-primary-600 dark:bg-primary-900/20 bg-primary-50 text-primary-700 dark:text-primary-100 mb-10 rounded-lg border px-4 py-3 text-sm">
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

        <div className="mb-12 text-center">
          <div className="mb-4 flex items-center justify-center">
            <Luggage className="text-primary-600 dark:text-primary-400 mr-3 h-12 w-12" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Pack It Up</h1>
          </div>
          <p className="mx-auto max-w-2xl text-xl text-gray-700 dark:text-gray-200">
            Generate personalized packing lists based on your destination, activities, and travel preferences
          </p>
          {isGuest && (
            <p className="mx-auto mt-4 max-w-2xl text-sm text-gray-600 dark:text-gray-300">
              You&apos;re exploring Pack It Up in guest mode. Preview the packing list generator, then create an account
              to keep your lists forever.
            </p>
          )}
        </div>

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
              <div className="mb-6 text-center">
                <button onClick={handleOpenHistory} className="btn-secondary mx-auto flex items-center space-x-2">
                  <History className="h-4 w-4" />
                  <span>{isSignedIn ? 'View Previous Lists' : 'Sign in to view history'}</span>
                </button>
              </div>

              <TripForm onSubmit={handleGenerateList} isLoading={isLoading} isGuest={isGuest} />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Trip Summary */}
              <div className="card">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Your Trip</h2>
                  <div className="flex items-center space-x-4">
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
                    <MapPin className="text-primary-600 dark:text-primary-400 h-5 w-5" />
                    <span className="text-gray-800 dark:text-gray-100">
                      <strong>Destination:</strong> {currentTrip.destination}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="text-primary-600 dark:text-primary-400 h-5 w-5" />
                    <span className="text-gray-800 dark:text-gray-100">
                      <strong>Duration:</strong> {currentTrip.duration} days
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="text-primary-600 dark:text-primary-400 h-5 w-5" />
                    <span className="text-gray-800 dark:text-gray-100">
                      <strong>Group Size:</strong> {currentTrip.groupSize} people
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Luggage className="text-primary-600 dark:text-primary-400 h-5 w-5" />
                    <span className="text-gray-800 dark:text-gray-100">
                      <strong>Climate:</strong> {currentTrip.climate}
                    </span>
                  </div>
                </div>
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
              />
              {isGuest && (
                <div className="border-primary-300 dark:border-primary-600 dark:bg-primary-900/10 text-primary-700 dark:text-primary-200 card bg-primary-50 border text-sm">
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
