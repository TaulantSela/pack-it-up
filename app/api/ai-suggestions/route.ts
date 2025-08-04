import { NextRequest, NextResponse } from 'next/server';
import { generateAIPackingSuggestions } from '@/lib/ai';
import { TripDetails } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tripDetails: TripDetails = body.tripDetails;

    const suggestions = await generateAIPackingSuggestions(tripDetails);

    return NextResponse.json({
      success: true,
      suggestions,
    });
  } catch (error) {
    console.error('Error generating AI suggestions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
} 