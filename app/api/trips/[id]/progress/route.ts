import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { itemId, checked } = body;

    // Upsert the progress record
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
    return NextResponse.json(
      { success: false, error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const progress = await prisma.packingProgress.findMany({
      where: { tripId: id },
    });

    return NextResponse.json({
      success: true,
      progress,
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch progress' },
      { status: 500 }
    );
  }
} 