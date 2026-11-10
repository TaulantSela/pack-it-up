import { prisma } from '@/lib/db';
import { progressUpdateSchema } from '@/lib/validation';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const parsed = progressUpdateSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid progress update' }, { status: 400 });
    }

    const { itemId, checked } = parsed.data;

    // Verify trip ownership and that the item belongs to the trip
    const trip = await prisma.trip.findFirst({
      where: {
        id,
        userId: userId,
      },
      include: {
        items: {
          where: { id: itemId },
          select: { id: true },
        },
      },
    });

    if (!trip || trip.items.length === 0) {
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
    }

    const progress = await prisma.packingProgress.upsert({
      where: {
        tripId_itemId: {
          tripId: id,
          itemId: itemId,
        },
      },
      update: {
        checked: checked,
        updatedAt: new Date(),
      },
      create: {
        tripId: id,
        itemId: itemId,
        checked: checked,
      },
    });

    return NextResponse.json({
      success: true,
      progress,
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json({ success: false, error: 'Failed to update progress' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify trip ownership
    const trip = await prisma.trip.findFirst({
      where: {
        id,
        userId: userId,
      },
    });

    if (!trip) {
      return NextResponse.json({ success: false, error: 'Trip not found' }, { status: 404 });
    }

    const progress = await prisma.packingProgress.findMany({
      where: { tripId: id },
    });

    return NextResponse.json({
      success: true,
      progress,
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch progress' }, { status: 500 });
  }
}

// Unchecks every item, so a list can be reused for a repeat trip
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify trip ownership
    const trip = await prisma.trip.findFirst({
      where: {
        id,
        userId: userId,
      },
    });

    if (!trip) {
      return NextResponse.json({ success: false, error: 'Trip not found' }, { status: 404 });
    }

    await prisma.packingProgress.deleteMany({
      where: { tripId: id },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error resetting progress:', error);
    return NextResponse.json({ success: false, error: 'Failed to reset progress' }, { status: 500 });
  }
}
