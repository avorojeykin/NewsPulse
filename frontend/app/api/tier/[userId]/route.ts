import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    // Proxy request to backend
    const backendUrl = process.env.BACKEND_WORKER_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/tier/${userId}`, {
      cache: 'no-store', // Always fetch fresh tier status
    });

    if (!response.ok) {
      throw new Error(`Backend API returned ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error checking tier:', error);
    return NextResponse.json(
      {
        error: 'Failed to check tier',
        userId: (await params).userId,
        tier: 'free',
        isPremium: false,
        deliveryDelay: 900000,
        deliveryDelayMinutes: 15,
      },
      { status: 500 }
    );
  }
}
