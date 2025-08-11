import { NextResponse } from 'next/server';
import { InstagramDataParser } from '@/lib/instagram-parser-server';
import path from 'path';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uploadedPath = searchParams.get('dataPath');
    const dataPath = uploadedPath || path.join(process.cwd(), 'data');
    const parser = new InstagramDataParser(dataPath);
    
    const participantsWithStatus = await parser.getConversationParticipantsWithStatus();
    const participantsArray = Array.from(participantsWithStatus.entries()).map(([id, participant]) => ({
      id,
      ...participant
    }));
    
    return NextResponse.json(participantsArray);
  } catch (error) {
    console.error('Error loading participants:', error);
    return NextResponse.json(
      { error: 'Failed to load participants data' },
      { status: 500 }
    );
  }
}