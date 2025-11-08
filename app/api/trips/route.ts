import { generateAIPackingSuggestions } from '@/lib/ai';
import { prisma } from '@/lib/db';
import { TripDetails } from '@/lib/types';
import { auth, currentUser } from '@clerk/nextjs/server';
import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

type IncomingPackingItem = {
  id?: string;
  name: string;
  category: string;
  essential: boolean;
  quantity: number;
  notes?: string | null;
  aiSuggested?: boolean;
};

type IncomingGuestProgress = {
  itemId: string;
  checked: boolean;
};

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const body = await request.json();
    const tripDetails: TripDetails = body.tripDetails;
    const isGuestRequest = !userId && Boolean(body.guestMode);

    if (!userId && !isGuestRequest) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const migrateGuestTrip: { items: IncomingPackingItem[]; progress?: IncomingGuestProgress[] } | undefined = userId
      ? body.migrateGuestTrip
      : undefined;
    const suggestionItems: IncomingPackingItem[] =
      migrateGuestTrip?.items ?? (await generateAIPackingSuggestions(tripDetails));

    if (userId) {
      const clerkUser = await currentUser();
      const primaryEmail = clerkUser?.emailAddresses.find((email) => email.id === clerkUser.primaryEmailAddressId);
      const userEmail = primaryEmail?.emailAddress || clerkUser?.emailAddresses[0]?.emailAddress || null;

      console.log('Creating/updating user:', {
        userId,
        userEmail,
        totalEmails: clerkUser?.emailAddresses.length,
        primaryEmailId: clerkUser?.primaryEmailAddressId,
      });

      try {
        await prisma.user.upsert({
          where: { id: userId },
          update: {
            email: userEmail,
          },
          create: {
            id: userId,
            email: userEmail,
          },
        });
      } catch (userError) {
        console.error('Error creating/updating user:', userError);
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to create user account',
            details: userError instanceof Error ? userError.message : 'Unknown error',
          },
          { status: 500 },
        );
      }

      let trip = await prisma.trip.create({
        data: {
          name: `${tripDetails.destination} - ${tripDetails.duration} days`,
          destination: tripDetails.destination,
          duration: tripDetails.duration,
          season: tripDetails.season,
          climate: tripDetails.climate,
          activities: JSON.stringify(tripDetails.activities),
          accommodation: tripDetails.accommodation,
          groupSize: tripDetails.groupSize,
          includesChildren: tripDetails.includesChildren,
          specialNeeds: JSON.stringify(tripDetails.specialNeeds),
          userId: userId,
          items: {
            create: suggestionItems.map((item) => ({
              name: item.name,
              category: item.category,
              essential: item.essential,
              quantity: item.quantity,
              notes: item.notes ?? null,
              aiSuggested: item.aiSuggested ?? true,
            })),
          },
        },
        include: {
          items: true,
          progress: true,
        },
      });

      if (migrateGuestTrip?.progress?.length) {
        const idMapping = new Map<string, string>();
        migrateGuestTrip.items.forEach((item, index) => {
          if (!trip.items[index]) {
            return;
          }
          if (item.id) {
            idMapping.set(item.id, trip.items[index].id);
          } else {
            idMapping.set(String(index), trip.items[index].id);
          }
        });

        const progressToCreate = migrateGuestTrip.progress
          .filter((progressEntry) => progressEntry.checked)
          .map((progressEntry) => {
            const mappedId = idMapping.get(progressEntry.itemId);
            if (!mappedId) {
              return null;
            }
            return {
              tripId: trip.id,
              itemId: mappedId,
              checked: true,
            };
          })
          .filter((entry): entry is { tripId: string; itemId: string; checked: boolean } => Boolean(entry));

        if (progressToCreate.length) {
          await prisma.packingProgress.createMany({
            data: progressToCreate,
            skipDuplicates: true,
          });

          trip = await prisma.trip.findUniqueOrThrow({
            where: { id: trip.id },
            include: {
              items: true,
              progress: true,
            },
          });
        }
      }

      return NextResponse.json({
        success: true,
        trip,
      });
    }

    const guestTripId = `guest-${randomUUID()}`;
    const timestamp = new Date().toISOString();
    const trip = {
      id: guestTripId,
      name: `${tripDetails.destination} - ${tripDetails.duration} days`,
      destination: tripDetails.destination,
      duration: tripDetails.duration,
      season: tripDetails.season,
      climate: tripDetails.climate,
      activities: JSON.stringify(tripDetails.activities),
      accommodation: tripDetails.accommodation,
      groupSize: tripDetails.groupSize,
      includesChildren: tripDetails.includesChildren,
      specialNeeds: JSON.stringify(tripDetails.specialNeeds),
      createdAt: timestamp,
      updatedAt: timestamp,
      userId: null,
      items: suggestionItems.map((item, index) => ({
        ...item,
        id: `${guestTripId}-item-${index}`,
        aiSuggested: item.aiSuggested ?? true,
      })),
      progress: [],
    };

    return NextResponse.json({
      success: true,
      trip,
    });
  } catch (error) {
    console.error('Error creating trip:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Failed to create trip', details: errorMessage },
      { status: 500 },
    );
  }
}

export async function GET() {
  console.log('GET request received');
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
      take: 20,
    });

    return NextResponse.json({
      success: true,
      trips,
    });
  } catch (error) {
    console.error('Error fetching trips:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch trips' }, { status: 500 });
  }
}
