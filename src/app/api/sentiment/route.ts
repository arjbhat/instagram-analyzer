import { NextRequest, NextResponse } from 'next/server';
import { analyzeConversationSentiment } from '@/lib/sentiment-client';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages data' }, { status: 400 });
    }

    const result = analyzeConversationSentiment(messages);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in sentiment analysis API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}