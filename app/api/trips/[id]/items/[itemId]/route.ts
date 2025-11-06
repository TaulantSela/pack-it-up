import { prisma } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id, itemId } = await params;
    const body = await request.json();
    const { quantity } = body;

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

    // Update the item quantity
    const updatedItem = await prisma.packingItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    return NextResponse.json({
      success: true,
      item: updatedItem,
    });
  } catch (error) {
    console.error('Error updating item:', error);
    return NextResponse.json({ success: false, error: 'Failed to update item' }, { status: 500 });
  }
}
