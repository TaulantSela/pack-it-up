import { prisma } from '@/lib/db';
import { packingItemInputSchema } from '@/lib/validation';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const parsed = packingItemInputSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid item' }, { status: 400 });
    }

    const { name, category, quantity, notes, essential } = parsed.data;

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

    // Create the new item
    const item = await prisma.packingItem.create({
      data: {
        name,
        category,
        quantity,
        notes: notes || null,
        essential,
        aiSuggested: false,
        tripId: id,
      },
    });

    return NextResponse.json({
      success: true,
      item,
    });
  } catch (error) {
    console.error('Error creating item:', error);
    return NextResponse.json({ success: false, error: 'Failed to create item' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { itemId } = await request.json();

    if (typeof itemId !== 'string' || !itemId) {
      return NextResponse.json({ success: false, error: 'Invalid item' }, { status: 400 });
    }

    // Verify trip ownership
    const trip = await prisma.trip.findFirst({
      where: {
        id,
        userId: userId,
      },
      include: {
        items: {
          where: { id: itemId },
        },
      },
    });

    if (!trip || trip.items.length === 0) {
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
    }

    // Delete the item and its checked state, so it no longer counts as packed
    await prisma.$transaction([
      prisma.packingProgress.deleteMany({ where: { tripId: id, itemId } }),
      prisma.packingItem.delete({ where: { id: itemId } }),
    ]);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete item' }, { status: 500 });
  }
}
