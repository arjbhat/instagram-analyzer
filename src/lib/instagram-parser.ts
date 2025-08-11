// Client-side utilities for Instagram data processing

export interface InstagramMessage {
  sender_name: string;
  timestamp_ms: number;
  content?: string;
  is_geoblocked_for_viewer: boolean;
  is_unsent_image_by_messenger_kid_parent: boolean;
  photos?: Array<{ uri: string; creation_timestamp: number }>;
  videos?: Array<{ uri: string; creation_timestamp: number }>;
  audio_files?: Array<{ uri: string; creation_timestamp: number }>;
  share?: { link?: string };
  reactions?: Array<{ reaction: string; actor: string }>;
}

export interface MessageStats {
  totalMessages: number;
  meaningfulMessages: number;
  attachments: number;
  reactions: number;
  likes: number;
  mediaShares: number;
  photos: number;
  videos: number;
  audioCalls: number;
  responseTimeAnalysis: ResponseTimeAnalysis;
}

export interface ResponseTimeAnalysis {
  averageResponseTime: number; // in minutes
  medianResponseTime: number; // in minutes
  fastestResponse: number; // in minutes
  slowestResponse: number; // in minutes
  responseTimesByParticipant: Record<string, {
    averageResponseTime: number;
    totalResponses: number;
    fastestResponse: number;
    slowestResponse: number;
  }>;
  conversationStarters: Record<string, number>; // who starts conversations
  responsiveness: Record<string, number>; // percentage of messages that got responses within 1 hour
}

export interface InstagramConversation {
  participants: Array<{ name: string }>;
  messages: InstagramMessage[];
}

export interface FollowerData {
  href: string;
  value: string;
  timestamp: number;
}

export interface InstagramFollower {
  string_list_data: FollowerData[];
}

export interface InstagramFollowing {
  relationships_following: Array<{
    string_list_data: FollowerData[];
  }>;
}

// Check if a message is meaningful (not a system message)
export function isMessageMeaningful(message: InstagramMessage): boolean {
  if (!message.content) return false;
  
  const content = message.content.trim();
  
  // Empty or whitespace only
  if (!content) return false;
  
  // Attachment messages
  if (/sent an attachment\.$/.test(content)) return false;
  
  // Reaction messages
  if (/^Reacted .+ to your message\s*$/.test(content)) return false;
  
  // Like messages
  if (/liked a message$/i.test(content)) return false;
  
  // Story/post/reel shares
  if (/shared a (story|post|reel|profile)\.$/.test(content)) return false;
  
  // Group chat actions
  if (/(added|removed|named the group|changed the group photo)/.test(content)) return false;
  
  // Call related (video and audio)
  if (/(started a call|joined the call|ended the call)/.test(content)) return false;
  if (/(started an audio call|missed an audio call|Audio call ended)/.test(content)) return false;
  if (/You (started an audio call|missed an audio call)/.test(content)) return false;
  
  // Other system messages
  if (/^This message is no longer available$/.test(content)) return false;
  if (/replied to your story/.test(content)) return false;
  if (/mentioned you/.test(content)) return false;
  
  return true;
}

// Calculate response time analysis
function calculateResponseTimeAnalysis(messages: InstagramMessage[]): ResponseTimeAnalysis {
  const meaningfulMessages = messages.filter(isMessageMeaningful);
  
  if (meaningfulMessages.length < 2) {
    return {
      averageResponseTime: 0,
      medianResponseTime: 0,
      fastestResponse: 0,
      slowestResponse: 0,
      responseTimesByParticipant: {},
      conversationStarters: {},
      responsiveness: {}
    };
  }

  // Sort messages by timestamp (oldest first) since Instagram stores newest first
  const sortedMessages = [...meaningfulMessages].sort((a, b) => a.timestamp_ms - b.timestamp_ms);

  const responseTimes: number[] = [];
  const responseTimesByParticipant: Record<string, number[]> = {};
  const conversationStarters: Record<string, number> = {};
  const responseCounts: Record<string, { responses: number; quickResponses: number }> = {};
  

  // Initialize participant tracking
  const participants = new Set(sortedMessages.map(m => m.sender_name));
  participants.forEach(name => {
    responseTimesByParticipant[name] = [];
    conversationStarters[name] = 0;
    responseCounts[name] = { responses: 0, quickResponses: 0 };
  });

  // Process messages oldest-first
  let lastMessageTime = sortedMessages[0].timestamp_ms;
  let lastMessageSender = sortedMessages[0].sender_name;
  let conversationGap = true; // Track if this starts a new conversation

  // First message is always a conversation starter
  conversationStarters[lastMessageSender]++;

  for (let i = 1; i < sortedMessages.length; i++) {
    const currentMessage = sortedMessages[i];
    // Calculate how long it took for the current message to respond to the last message
    const timeDiff = (currentMessage.timestamp_ms - lastMessageTime) / (1000 * 60); // minutes

    // If more than 2 hours gap, consider it a new conversation
    if (timeDiff > 120) {
      conversationGap = true;
    }

    // If it's a new conversation, count as conversation starter
    if (conversationGap) {
      conversationStarters[currentMessage.sender_name]++;
      conversationGap = false;
    }
    // If different sender and within reasonable time (< 24 hours), it's a response
    else if (currentMessage.sender_name !== lastMessageSender && timeDiff < 1440 && timeDiff > 0) {
      responseTimes.push(timeDiff);
      responseTimesByParticipant[currentMessage.sender_name].push(timeDiff);
      responseCounts[currentMessage.sender_name].responses++;
      
      // Count as quick response if within 1 hour
      if (timeDiff <= 60) {
        responseCounts[currentMessage.sender_name].quickResponses++;
      }
    }

    lastMessageTime = currentMessage.timestamp_ms;
    lastMessageSender = currentMessage.sender_name;
  }

  // Calculate statistics
  const averageResponseTime = responseTimes.length > 0 
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
    : 0;

  const sortedResponseTimes = [...responseTimes].sort((a, b) => a - b);
  const medianResponseTime = sortedResponseTimes.length > 0
    ? sortedResponseTimes[Math.floor(sortedResponseTimes.length / 2)]
    : 0;

  const fastestResponse = responseTimes.length > 0 ? Math.min(...responseTimes) : 0;
  const slowestResponse = responseTimes.length > 0 ? Math.max(...responseTimes) : 0;


  // Calculate per-participant stats
  const responseTimesByParticipantStats: Record<string, {
    averageResponseTime: number;
    totalResponses: number;
    fastestResponse: number;
    slowestResponse: number;
  }> = {};

  const responsiveness: Record<string, number> = {};

  Object.entries(responseTimesByParticipant).forEach(([name, times]) => {
    if (times.length > 0) {
      responseTimesByParticipantStats[name] = {
        averageResponseTime: times.reduce((a, b) => a + b, 0) / times.length,
        totalResponses: times.length,
        fastestResponse: Math.min(...times),
        slowestResponse: Math.max(...times)
      };
    } else {
      responseTimesByParticipantStats[name] = {
        averageResponseTime: 0,
        totalResponses: 0,
        fastestResponse: 0,
        slowestResponse: 0
      };
    }

    // Calculate responsiveness (percentage of quick responses)
    const counts = responseCounts[name];
    responsiveness[name] = counts.responses > 0 
      ? (counts.quickResponses / counts.responses) * 100 
      : 0;
  });

  return {
    averageResponseTime,
    medianResponseTime,
    fastestResponse,
    slowestResponse,
    responseTimesByParticipant: responseTimesByParticipantStats,
    conversationStarters,
    responsiveness
  };
}

// Get statistics about messages
export function getMessageStats(messages: InstagramMessage[]): MessageStats {
  const stats: MessageStats = {
    totalMessages: messages.length,
    meaningfulMessages: 0,
    attachments: 0,
    reactions: 0,
    likes: 0,
    mediaShares: 0,
    photos: 0,
    videos: 0,
    audioCalls: 0,
    responseTimeAnalysis: calculateResponseTimeAnalysis(messages)
  };

  for (const message of messages) {
    if (isMessageMeaningful(message)) {
      stats.meaningfulMessages++;
    }
    
    if (message.content) {
      if (/sent an attachment\.$/.test(message.content)) stats.attachments++;
      if (/^Reacted .+ to your message/.test(message.content)) stats.reactions++;
      if (/liked a message$/i.test(message.content)) stats.likes++;
      if (/shared a (story|post|reel|profile)\.$/.test(message.content)) stats.mediaShares++;
      if (/(started an audio call|missed an audio call|Audio call ended|You (started an audio call|missed an audio call))/.test(message.content)) stats.audioCalls++;
    }
    
    if (message.photos && message.photos.length > 0) stats.photos += message.photos.length;
    if (message.videos && message.videos.length > 0) stats.videos += message.videos.length;
  }

  return stats;
}

// Helper function to format time duration in a readable way
export function formatDuration(minutes: number): string {
  if (minutes < 0.1) { // Less than 6 seconds
    return 'Instant';
  } else if (minutes < 1) {
    const seconds = Math.round(minutes * 60);
    return `${seconds}s`;
  } else if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  } else if (minutes < 1440) { // Less than 24 hours
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  } else { // 24 hours or more
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    if (days === 1 && hours === 0) {
      return '1 day';
    } else if (hours === 0) {
      return `${days} days`;
    } else {
      return `${days}d ${hours}h`;
    }
  }
}

// Conversation momentum analysis
export interface ConversationMomentum {
  peakPeriods: Array<{
    date: string;
    messageCount: number;
    period: 'hour' | 'day' | 'week' | 'month';
  }>;
  quietPeriods: Array<{
    startDate: string;
    endDate: string;
    durationDays: number;
  }>;
  overallTrend: 'increasing' | 'decreasing' | 'stable';
  averageGapBetweenMessages: number; // in hours
  longestQuietPeriod: number; // in days
}

export function calculateConversationMomentum(messages: InstagramMessage[]): ConversationMomentum {
  const meaningfulMessages = messages
    .filter(isMessageMeaningful)
    .sort((a, b) => a.timestamp_ms - b.timestamp_ms); // oldest first

  if (meaningfulMessages.length < 2) {
    return {
      peakPeriods: [],
      quietPeriods: [],
      overallTrend: 'stable',
      averageGapBetweenMessages: 0,
      longestQuietPeriod: 0
    };
  }

  // Group messages by day
  const messagesByDay: Record<string, number> = {};
  meaningfulMessages.forEach(message => {
    const date = new Date(message.timestamp_ms).toISOString().split('T')[0];
    messagesByDay[date] = (messagesByDay[date] || 0) + 1;
  });

  // Find peak periods (days with above-average activity)
  const dailyCounts = Object.values(messagesByDay);
  const averageDaily = dailyCounts.reduce((a, b) => a + b, 0) / dailyCounts.length;
  const threshold = Math.max(averageDaily * 1.5, 5); // At least 1.5x average or 5 messages

  const peakPeriods = Object.entries(messagesByDay)
    .filter(([, count]) => count >= threshold)
    .map(([date, count]) => ({
      date,
      messageCount: count,
      period: 'day' as const
    }))
    .sort((a, b) => b.messageCount - a.messageCount)
    .slice(0, 10); // Top 10 peak days

  // Find quiet periods (gaps of more than 7 days)
  const quietPeriods: Array<{
    startDate: string;
    endDate: string;
    durationDays: number;
  }> = [];

  for (let i = 1; i < meaningfulMessages.length; i++) {
    const prevTime = meaningfulMessages[i - 1].timestamp_ms;
    const currTime = meaningfulMessages[i].timestamp_ms;
    const gapDays = (currTime - prevTime) / (1000 * 60 * 60 * 24);

    if (gapDays > 7) {
      quietPeriods.push({
        startDate: new Date(prevTime).toISOString().split('T')[0],
        endDate: new Date(currTime).toISOString().split('T')[0],
        durationDays: Math.round(gapDays)
      });
    }
  }

  // Calculate overall trend using time-based periods instead of message count
  const totalTimeSpan = meaningfulMessages[meaningfulMessages.length - 1].timestamp_ms - meaningfulMessages[0].timestamp_ms;
  const midpointTime = meaningfulMessages[0].timestamp_ms + (totalTimeSpan / 2);
  
  // Split by time, not by message count
  const firstHalf = meaningfulMessages.filter(msg => msg.timestamp_ms <= midpointTime);
  const secondHalf = meaningfulMessages.filter(msg => msg.timestamp_ms > midpointTime);
  
  // Calculate actual time spans in days
  const firstHalfDays = firstHalf.length > 1 
    ? (firstHalf[firstHalf.length - 1].timestamp_ms - firstHalf[0].timestamp_ms) / (1000 * 60 * 60 * 24)
    : 1;
  const secondHalfDays = secondHalf.length > 1 
    ? (secondHalf[secondHalf.length - 1].timestamp_ms - secondHalf[0].timestamp_ms) / (1000 * 60 * 60 * 24)
    : 1;
  
  // Messages per day rate
  const firstHalfRate = firstHalf.length / Math.max(firstHalfDays, 1);
  const secondHalfRate = secondHalf.length / Math.max(secondHalfDays, 1);
  
  let overallTrend: 'increasing' | 'decreasing' | 'stable';
  // Use a more sensitive threshold since we now have accurate time-based rates
  if (secondHalfRate > firstHalfRate * 1.3) {
    overallTrend = 'increasing';
  } else if (secondHalfRate < firstHalfRate * 0.7) {
    overallTrend = 'decreasing';
  } else {
    overallTrend = 'stable';
  }

  // Calculate average gap between messages
  const gaps = [];
  for (let i = 1; i < meaningfulMessages.length; i++) {
    const gap = (meaningfulMessages[i].timestamp_ms - meaningfulMessages[i - 1].timestamp_ms) / (1000 * 60 * 60); // hours
    gaps.push(gap);
  }
  const averageGapBetweenMessages = gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;

  // Find longest quiet period
  const longestQuietPeriod = quietPeriods.length > 0 
    ? Math.max(...quietPeriods.map(p => p.durationDays))
    : 0;

  return {
    peakPeriods,
    quietPeriods: quietPeriods.sort((a, b) => b.durationDays - a.durationDays).slice(0, 5), // Top 5 longest quiet periods
    overallTrend,
    averageGapBetweenMessages,
    longestQuietPeriod
  };
}