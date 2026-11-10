import { prisma } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const trip = await prisma.trip.findFirst({
      where: {
        id,
        userId: userId,
      },
      include: {
        items: true,
      },
    });

    if (!trip) {
      return NextResponse.json({ success: false, error: 'Trip not found' }, { status: 404 });
    }

    // Copy the list as it is now, including custom items and edited quantities, with nothing checked
    const copy = await prisma.trip.create({
      data: {
        name: `${trip.name} (copy)`,
        origin: trip.origin,
        destination: trip.destination,
        duration: trip.duration,
        season: trip.season,
        climate: trip.climate,
        activities: trip.activities,
        accommodation: trip.accommodation,
        groupSize: trip.groupSize,
        includesChildren: trip.includesChildren,
        specialNeeds: trip.specialNeeds,
        userId: userId,
        items: {
          create: trip.items.map((item) => ({
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
        progress: true,
      },
    });

    return NextResponse.json({
      success: true,
      trip: copy,
    });
  } catch (error) {
    console.error('Error duplicating trip:', error);
    return NextResponse.json({ success: false, error: 'Failed to duplicate trip' }, { status: 500 });
  }
}
