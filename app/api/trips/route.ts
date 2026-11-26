import { generatePackingSuggestions, SuggestionSource } from '@/lib/ai';
import { parseDate } from '@/lib/dates';
import { prisma } from '@/lib/db';
import { getClientIp, isRateLimited } from '@/lib/rate-limit';
import { normalizeTravelers } from '@/lib/travelers';
import { buildTripContext, tripContextFromSaved } from '@/lib/trip-context';
import { pluralize } from '@/lib/utils';
import { guestTripMigrationSchema, tripDetailsSchema } from '@/lib/validation';
import { auth, currentUser } from '@clerk/nextjs/server';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

const HISTORY_LIMIT = 50;
const HOUR_MS = 60 * 60 * 1000;
const GUEST_LISTS_PER_HOUR = 10;
const USER_LISTS_PER_HOUR = 20;

// The email is only stored when the account's row is created, so Clerk is asked just once
async function createUserRow(userId: string) {
  const clerkUser = await currentUser();
  const primaryEmail = clerkUser?.emailAddresses.find((email) => email.id === clerkUser.primaryEmailAddressId);
  const userEmail = primaryEmail?.emailAddress || clerkUser?.emailAddresses[0]?.emailAddress || null;
  // upsert, in case two first requests race
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId, email: userEmail },
  });
}

const rateLimitedResponse = () =>
  NextResponse.json(
    {
      success: false,
      error: "You've generated a lot of lists in the last hour. Please try again a bit later.",
    },
    { status: 429 },
  );

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const body = await request.json();
    const isGuestRequest = !userId && Boolean(body.guestMode);

    if (!userId && !isGuestRequest) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const parsedDetails = tripDetailsSchema.safeParse(body.tripDetails);
    if (!parsedDetails.success) {
      return NextResponse.json(
        { success: false, error: 'Please check the trip details and try again.' },
        { status: 400 },
      );
    }
    const tripDetails = parsedDetails.data;

    const parsedMigration =
      userId && body.migrateGuestTrip ? guestTripMigrationSchema.safeParse(body.migrateGuestTrip) : undefined;
    if (parsedMigration && !parsedMigration.success) {
      return NextResponse.json({ success: false, error: 'Could not save the guest list.' }, { status: 400 });
    }
    const migrateGuestTrip = parsedMigration?.data;

    let source: SuggestionSource | undefined;
    let suggestionItems: {
      id: string;
      name: string;
      category: string;
      essential: boolean;
      quantity: number;
      notes?: string | null;
      aiSuggested?: boolean;
    }[];

    if (!migrateGuestTrip) {
      const limited = userId
        ? (await prisma.trip.count({ where: { userId, createdAt: { gte: new Date(Date.now() - HOUR_MS) } } })) >=
          USER_LISTS_PER_HOUR
        : isRateLimited(`guest:${getClientIp(request.headers)}`, GUEST_LISTS_PER_HOUR, HOUR_MS);

      if (limited) {
        return rateLimitedResponse();
      }
    }

    // Duration, season and weather come from the dates and destination; a guest list moving to an
    // account brings the ones it already has
    const tripContext = migrateGuestTrip?.context
      ? tripContextFromSaved(tripDetails, migrateGuestTrip.context)
      : await buildTripContext(tripDetails);

    if (migrateGuestTrip) {
      suggestionItems = migrateGuestTrip.items;
    } else {
      const suggestions = await generatePackingSuggestions(tripContext);
      source = suggestions.source;
      suggestionItems = suggestions.items.map((item) => ({ ...item, id: randomUUID() }));
    }

    const tripData = {
      name: `${tripDetails.destination} - ${pluralize(tripContext.duration, 'day')}`,
      origin: tripDetails.origin,
      destination: tripDetails.destination,
      startDate: parseDate(tripDetails.startDate),
      endDate: parseDate(tripDetails.endDate),
      transport: tripDetails.transport,
      weather: tripContext.weather ? JSON.stringify(tripContext.weather) : null,
      duration: tripContext.duration,
      season: tripContext.season,
      climate: tripContext.climate,
      activities: JSON.stringify(tripDetails.activities),
      accommodation: tripDetails.accommodation,
      groupSize: tripDetails.groupSize,
      travelers: JSON.stringify(normalizeTravelers(tripDetails.travelers, tripDetails.groupSize)),
      includesChildren: tripDetails.includesChildren,
      specialNeeds: JSON.stringify(tripDetails.specialNeeds),
    };

    if (userId) {
      // Guest item ids are replaced with new ones, so map the old ids to keep checked items checked
      const newItemIds = new Map(suggestionItems.map((item) => [item.id, randomUUID()]));
      const progressToCreate = [
        ...new Map(
          (migrateGuestTrip?.progress ?? [])
            .filter((entry) => entry.checked && newItemIds.has(entry.itemId) && entry.person < tripDetails.groupSize)
            .map((entry) => [
              `${entry.itemId}:${entry.person}`,
              { itemId: newItemIds.get(entry.itemId)!, person: entry.person, checked: true },
            ]),
        ).values(),
      ];

      const createTrip = () =>
        prisma.trip.create({
          data: {
            ...tripData,
            userId: userId,
            items: {
              create: suggestionItems.map((item) => ({
                id: newItemIds.get(item.id),
                name: item.name,
                category: item.category,
                essential: item.essential,
                quantity: item.quantity,
                notes: item.notes ?? null,
                aiSuggested: item.aiSuggested ?? false,
              })),
            },
            progress: progressToCreate.length ? { create: progressToCreate } : undefined,
          },
          include: {
            items: true,
            progress: true,
          },
        });

      // The account's row isn't looked up first, since every query crosses the Atlantic: the create
      // fails on the foreign key only for an account's first list, before its row exists
      let trip;
      try {
        trip = await createTrip();
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003')) {
          throw error;
        }
        try {
          await createUserRow(userId);
        } catch (userError) {
          console.error('Error creating user:', userError);
          return NextResponse.json({ success: false, error: 'Failed to create user account' }, { status: 500 });
        }
        trip = await createTrip();
      }

      return NextResponse.json({
        success: true,
        trip,
        source,
      });
    }

    const guestTripId = `guest-${randomUUID()}`;
    const timestamp = new Date().toISOString();
    const trip = {
      ...tripData,
      id: guestTripId,
      createdAt: timestamp,
      updatedAt: timestamp,
      userId: null,
      items: suggestionItems.map((item) => ({
        ...item,
        id: `${guestTripId}-${item.id}`,
        aiSuggested: item.aiSuggested ?? false,
      })),
      progress: [],
    };

    return NextResponse.json({
      success: true,
      trip,
      source,
    });
  } catch (error) {
    console.error('Error creating trip:', error);
    return NextResponse.json({ success: false, error: 'Failed to create trip' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const trips = await prisma.trip.findMany({
      where: {
        userId: userId,
      },
      include: {
        items: true,
        progress: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: HISTORY_LIMIT,
    });

    return NextResponse.json({
      success: true,
      trips,
      limit: HISTORY_LIMIT,
    });
  } catch (error) {
    console.error('Error fetching trips:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch trips' }, { status: 500 });
  }
}
