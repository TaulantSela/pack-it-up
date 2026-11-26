import { prisma } from '@/lib/db';
import { progressUpdateSchema } from '@/lib/validation';
import { auth } from '@clerk/nextjs/server';
import type { PackingProgress } from '@prisma/client';
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
    const persons = [...new Set(parsed.data.persons)];

    // Verify the item belongs to one of this user's trips
    const item = await prisma.packingItem.findFirst({
      where: { id: itemId, tripId: id, trip: { userId } },
      select: { trip: { select: { groupSize: true } } },
    });

    if (!item) {
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
    }

    if (persons.some((person) => person >= item.trip.groupSize)) {
      return NextResponse.json({ success: false, error: 'Invalid progress update' }, { status: 400 });
    }

    // One statement for every person: each query crosses the Atlantic, and a transaction of upserts
    // took a round trip per person plus two. Timestamps are UTC, as Prisma writes them
    const progress = await prisma.$queryRaw<PackingProgress[]>`
      INSERT INTO "PackingProgress" ("id", "tripId", "itemId", "person", "checked", "createdAt", "updatedAt")
      SELECT gen_random_uuid()::text, ${id}, ${itemId}, person, ${checked}, now() AT TIME ZONE 'UTC', now() AT TIME ZONE 'UTC'
      FROM unnest(${persons}::int[]) AS person
      ON CONFLICT ("tripId", "itemId", "person")
      DO UPDATE SET "checked" = EXCLUDED."checked", "updatedAt" = EXCLUDED."updatedAt"
      RETURNING *`;

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

    // Verify trip ownership, and load its ticks in the same query
    const trip = await prisma.trip.findFirst({
      where: {
        id,
        userId: userId,
      },
      select: { progress: true },
    });

    if (!trip) {
      return NextResponse.json({ success: false, error: 'Trip not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      progress: trip.progress,
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
