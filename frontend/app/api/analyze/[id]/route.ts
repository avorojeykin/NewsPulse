import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log(`\n🔵 [NEXT-PROXY] POST /api/analyze/${id} - Proxying to backend`);

    // Proxy request to backend
    const backendUrl = process.env.BACKEND_WORKER_URL || 'http://localhost:3001';
    const targetUrl = `${backendUrl}/api/news/${id}/analyze`;

    console.log(`🔵 [NEXT-PROXY] Backend URL: ${backendUrl}`);
    console.log(`🔵 [NEXT-PROXY] Target URL: ${targetUrl}`);
    console.log(`🔵 [NEXT-PROXY] Sending POST request to backend...`);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(`🔵 [NEXT-PROXY] Backend response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [NEXT-PROXY] Backend error: ${errorText}`);
      throw new Error(`Backend API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log(`✅ [NEXT-PROXY] Backend response data:`, data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ [NEXT-PROXY] Error proxying AI analysis request:', error);
    return NextResponse.json(
      { error: 'Failed to request AI analysis' },
      { status: 500 }
    );
  }
}
