import { NextRequest, NextResponse } from 'next/server';
import { isMessageMeaningful } from '@/lib/instagram-parser';

import { SentimentAnalyzer } from 'node-nlp';

const sentimentAnalyzer = new SentimentAnalyzer({ language: 'en' });

export interface SentimentResult {
  score: number;
  comparative: number;
  positive: string[];
  negative: string[];
  label: 'positive' | 'negative' | 'neutral';
  intensity: 'low' | 'medium' | 'high';
}

export interface ConversationSentiment {
  overallScore: number;
  overallLabel: 'positive' | 'negative' | 'neutral';
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  totalMessages: number;
  mostPositiveMessage: { content: string; score: number } | null;
  mostNegativeMessage: { content: string; score: number } | null;
  sentimentTrend: Array<{ date: string; score: number }>;
  activityTrend: Array<{ date: string; messageCount: number }>;
  messageSentiments: Array<{ content: string; sentiment: SentimentResult }>;
}

async function analyzeSentiment(text: string): Promise<SentimentResult> {
  if (!text || text.trim().length === 0) {
    return {
      score: 0,
      comparative: 0,
      positive: [],
      negative: [],
      label: 'neutral',
      intensity: 'low'
    };
  }

  try {
    const result = await sentimentAnalyzer.getSentiment(text);
    
    // node-nlp returns: { score, numWords, numHits, comparative, type, language }
    // Determine label based on score
    let label: 'positive' | 'negative' | 'neutral';
    if (result.score > 0) {
      label = 'positive';
    } else if (result.score < 0) {
      label = 'negative';
    } else {
      label = 'neutral';
    }

    // Determine intensity based on comparative score - more sensitive thresholds
    let intensity: 'low' | 'medium' | 'high';
    const absComparative = Math.abs(result.comparative);
    if (absComparative >= 0.1) {
      intensity = 'high';
    } else if (absComparative >= 0.05) {
      intensity = 'medium';
    } else {
      intensity = 'low';
    }

    return {
      score: result.score,
      comparative: result.comparative,
      positive: [], // node-nlp doesn't return individual positive words
      negative: [], // node-nlp doesn't return individual negative words
      label,
      intensity
    };
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    return {
      score: 0,
      comparative: 0,
      positive: [],
      negative: [],
      label: 'neutral',
      intensity: 'low'
    };
  }
}

async function analyzeConversationSentiment(messages: Array<{ content?: string; timestamp_ms: number; sender_name: string }>): Promise<ConversationSentiment> {
  // Filter to only meaningful messages using the existing isMessageMeaningful function
  const meaningfulMessages = messages.filter(msg => isMessageMeaningful({
    ...msg,
    is_geoblocked_for_viewer: false,
    is_unsent_image_by_messenger_kid_parent: false
  }));
  
  if (meaningfulMessages.length === 0) {
    return {
      overallScore: 0,
      overallLabel: 'neutral',
      positiveCount: 0,
      negativeCount: 0,
      neutralCount: 0,
      totalMessages: 0,
      mostPositiveMessage: null,
      mostNegativeMessage: null,
      sentimentTrend: [],
      activityTrend: [],
      messageSentiments: []
    };
  }

  const sentimentPromises = meaningfulMessages.map(async msg => ({
    ...msg,
    sentiment: await analyzeSentiment(msg.content || '')
  }));
  
  const sentimentResults = await Promise.all(sentimentPromises);

  // Calculate counts
  const positiveCount = sentimentResults.filter(r => r.sentiment.label === 'positive').length;
  const negativeCount = sentimentResults.filter(r => r.sentiment.label === 'negative').length;
  const neutralCount = sentimentResults.filter(r => r.sentiment.label === 'neutral').length;

  // Calculate overall score
  const totalScore = sentimentResults.reduce((sum, r) => sum + r.sentiment.score, 0);
  const overallScore = totalScore / sentimentResults.length;
  
  let overallLabel: 'positive' | 'negative' | 'neutral';
  if (overallScore > 0.1) {
    overallLabel = 'positive';
  } else if (overallScore < -0.1) {
    overallLabel = 'negative';
  } else {
    overallLabel = 'neutral';
  }

  // Find most positive and negative messages
  const sortedByScore = sentimentResults.sort((a, b) => b.sentiment.score - a.sentiment.score);
  const mostPositiveMessage = sortedByScore[0]?.sentiment.score > 0 ? {
    content: sortedByScore[0].content || '',
    score: sortedByScore[0].sentiment.score
  } : null;

  const mostNegativeMessage = sortedByScore[sortedByScore.length - 1]?.sentiment.score < 0 ? {
    content: sortedByScore[sortedByScore.length - 1].content || '',
    score: sortedByScore[sortedByScore.length - 1].sentiment.score
  } : null;

  // Create sentiment trend and activity trend (group by day)
  const dailyData = new Map<string, { sentimentTotal: number; messageCount: number }>();
  
  sentimentResults.forEach(result => {
    const date = new Date(result.timestamp_ms).toDateString();
    const existing = dailyData.get(date) || { sentimentTotal: 0, messageCount: 0 };
    dailyData.set(date, {
      sentimentTotal: existing.sentimentTotal + result.sentiment.score,
      messageCount: existing.messageCount + 1
    });
  });

  const sortedDays = Array.from(dailyData.entries())
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()); // All time data

  const sentimentTrend = sortedDays.map(([date, data]) => ({
    date,
    score: data.sentimentTotal / data.messageCount
  }));

  const activityTrend = sortedDays.map(([date, data]) => ({
    date,
    messageCount: data.messageCount
  }));

  return {
    overallScore,
    overallLabel,
    positiveCount,
    negativeCount,
    neutralCount,
    totalMessages: sentimentResults.length,
    mostPositiveMessage,
    mostNegativeMessage,
    sentimentTrend,
    activityTrend,
    messageSentiments: sentimentResults.map(result => ({
      content: result.content || '',
      sentiment: result.sentiment
    }))
  };
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages data' }, { status: 400 });
    }

    const result = await analyzeConversationSentiment(messages);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in sentiment analysis API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}