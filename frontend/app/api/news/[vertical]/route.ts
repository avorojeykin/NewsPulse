import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ vertical: string }> }
) {
  try {
    const { vertical } = await params;
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '20';
    const ticker = searchParams.get('ticker');
    const userId = searchParams.get('userId');

    // Build query params
    const queryParams = new URLSearchParams({ limit });
    if (ticker) {
      queryParams.append('ticker', ticker);
    }
    if (userId) {
      queryParams.append('userId', userId);
    }

    // Fetch from backend API
    const backendUrl = process.env.BACKEND_WORKER_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/news/${vertical}?${queryParams.toString()}`, {
      cache: 'no-store', // Always fetch fresh data
    });

    if (!response.ok) {
      throw new Error(`Backend API returned ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news', news: [], count: 0 },
      { status: 500 }
    );
  }
}
