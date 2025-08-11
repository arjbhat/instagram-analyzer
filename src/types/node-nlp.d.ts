declare module 'node-nlp' {
  export class SentimentAnalyzer {
    constructor(options?: { language?: string });
    getSentiment(text: string): Promise<{
      score: number;
      numWords: number;
      numHits: number;
      comparative: number;
      type: string;
      language: string;
    }>;
  }
}