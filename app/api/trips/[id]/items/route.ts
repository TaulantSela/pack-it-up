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
    const body = await request.json();
    const { name, category, quantity, notes, essential } = body;

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
        quantity: quantity || 1,
        notes: notes || null,
        essential: essential || false,
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

    // Delete the item
    await prisma.packingItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete item' }, { status: 500 });
  }
}
