import { generateAIPackingSuggestions } from '@/lib/ai';
import { prisma } from '@/lib/db';
import { TripDetails } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tripDetails: TripDetails = body.tripDetails;

    // Generate AI-powered packing suggestions
    const aiSuggestions = await generateAIPackingSuggestions(tripDetails);

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
    return NextResponse.json({ success: false, error: 'Failed to create trip' }, { status: 500 });
  }
}

export async function GET() {
  console.log('GET request received');
  try {
    const trips = await prisma.trip.findMany({
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
