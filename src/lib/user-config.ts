// User detection utilities
export function detectUserName(conversations: Array<{participants: Array<{name: string}>}>): string {
  // Count frequency of each participant across all conversations
  const nameFrequency: Record<string, number> = {};
  
  conversations.forEach(conv => {
    conv.participants.forEach(p => {
      nameFrequency[p.name] = (nameFrequency[p.name] || 0) + 1;
    });
  });
  
  // The user is likely the person who appears in the most conversations
  const sortedByFrequency = Object.entries(nameFrequency)
    .sort(([,a], [,b]) => b - a);
  
  return sortedByFrequency[0]?.[0] || 'Unknown User';
}