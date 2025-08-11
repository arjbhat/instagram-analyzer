import { NextResponse } from 'next/server';
import { InstagramDataParser } from '@/lib/instagram-parser-server';
import path from 'path';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uploadedPath = searchParams.get('dataPath');
    const dataPath = uploadedPath || path.join(process.cwd(), 'data');
    const parser = new InstagramDataParser(dataPath);
    
    const conversations = await parser.getConversations();
    const conversationsArray = Array.from(conversations.entries()).map(([id, conversation]) => ({
      id,
      ...conversation
    }));
    
    return NextResponse.json(conversationsArray);
  } catch (error) {
    console.error('Error loading conversations:', error);
    return NextResponse.json(
      { error: 'Failed to load conversations data' },
      { status: 500 }
    );
  }
}