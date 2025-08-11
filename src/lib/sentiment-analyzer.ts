// Sentiment analysis utilities for Instagram messages (client-side)

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

export async function analyzeConversationSentiment(messages: Array<{ content?: string; timestamp_ms: number; sender_name: string }>): Promise<ConversationSentiment> {
  try {
    const response = await fetch('/api/sentiment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error calling sentiment API:', error);
    // Return neutral sentiment on error
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
}

export function getSentimentBorder(sentiment: SentimentResult): string {
  // Apply borders for any non-neutral sentiment, regardless of intensity
  if (sentiment.label === 'positive') {
    return 'border-green-400';
  } else if (sentiment.label === 'negative') {
    return 'border-red-400';
  }
  return '';
}

