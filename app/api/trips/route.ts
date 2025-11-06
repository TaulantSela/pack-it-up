import { generateAIPackingSuggestions } from '@/lib/ai';
import { prisma } from '@/lib/db';
import { TripDetails } from '@/lib/types';
import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const tripDetails: TripDetails = body.tripDetails;

    // Generate AI-powered packing suggestions
    const aiSuggestions = await generateAIPackingSuggestions(tripDetails);

    // Get user email from Clerk
    const clerkUser = await currentUser();

    // Try to get the primary email, or the first email, or null
    const primaryEmail = clerkUser?.emailAddresses.find((email) => email.id === clerkUser.primaryEmailAddressId);
    const userEmail = primaryEmail?.emailAddress || clerkUser?.emailAddresses[0]?.emailAddress || null;

    console.log('Creating/updating user:', {
      userId,
      userEmail,
      totalEmails: clerkUser?.emailAddresses.length,
      primaryEmailId: clerkUser?.primaryEmailAddressId,
    });

    // Ensure user exists in database
    try {
      await prisma.user.upsert({
        where: { id: userId },
        update: {
          email: userEmail, // Update email if it changed
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

    // Create the trip in the database
    const trip = await prisma.trip.create({
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
          create: aiSuggestions.map((item) => ({
            name: item.name,
            category: item.category,
            essential: item.essential,
            quantity: item.quantity,
            notes: item.notes,
            aiSuggested: item.aiSuggested,
          })),
        },
      },
      include: {
        items: true,
      },
    });

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
      take: 20, // Limit to last 20 trips
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
