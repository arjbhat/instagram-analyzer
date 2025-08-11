// Server-side Instagram data parser (uses Node.js fs)
import fs from 'fs';
import path from 'path';
import iconv from 'iconv-lite';

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

// Fix Instagram's UTF-8 encoding issues
function fixTextEncoding(text: string): string {
  if (!text || typeof text !== 'string') return text;
  
  try {
    // Instagram JSON exports often have UTF-8 text incorrectly interpreted as Latin-1
    // Convert from Latin-1 to UTF-8 to fix mojibake
    return iconv.decode(iconv.encode(text, 'latin1'), 'utf8');
  } catch {
    // If conversion fails, return original text
    return text;
  }
}

// Recursively fix encoding in JSON objects
function fixEncodingInObject<T>(obj: T): T {
  if (typeof obj === 'string') {
    return fixTextEncoding(obj) as T;
  } else if (Array.isArray(obj)) {
    return obj.map(item => fixEncodingInObject(item)) as T;
  } else if (obj !== null && typeof obj === 'object') {
    const fixed: Record<string, unknown> = {};
    for (const key in obj) {
      fixed[key] = fixEncodingInObject(obj[key]);
    }
    return fixed as T;
  }
  return obj;
}

export class InstagramDataParser {
  private dataPath: string;

  constructor(dataPath = './data') {
    this.dataPath = dataPath;
  }

  // Parse all message conversations
  async getConversations(): Promise<Map<string, InstagramConversation>> {
    const conversations = new Map<string, InstagramConversation>();
    const messagesPath = path.join(this.dataPath, 'your_instagram_activity/messages/inbox');
    
    if (!fs.existsSync(messagesPath)) {
      throw new Error('Messages path not found');
    }

    const conversationDirs = fs.readdirSync(messagesPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const conversationDir of conversationDirs) {
      const conversationPath = path.join(messagesPath, conversationDir);
      const messageFiles = fs.readdirSync(conversationPath)
        .filter(file => file.startsWith('message_') && file.endsWith('.json'));

      let allMessages: InstagramMessage[] = [];
      let participants: Array<{ name: string }> = [];

      for (const messageFile of messageFiles) {
        const filePath = path.join(conversationPath, messageFile);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const rawData = JSON.parse(fileContent);
        
        // Fix text encoding issues in the conversation data
        const conversationData: InstagramConversation = fixEncodingInObject(rawData);
        
        if (conversationData.participants) {
          participants = conversationData.participants;
        }
        
        if (conversationData.messages) {
          allMessages = allMessages.concat(conversationData.messages);
        }
      }

      // Sort messages by timestamp (oldest first - normal chat order where newest is at bottom)
      allMessages.sort((a, b) => a.timestamp_ms - b.timestamp_ms);

      conversations.set(conversationDir, {
        participants,
        messages: allMessages
      });
    }

    return conversations;
  }

  // Parse followers data
  async getFollowers(): Promise<FollowerData[]> {
    const followersPath = path.join(this.dataPath, 'connections/followers_and_following/followers_1.json');
    
    if (!fs.existsSync(followersPath)) {
      throw new Error('Followers file not found');
    }

    const fileContent = fs.readFileSync(followersPath, 'utf-8');
    const rawData = JSON.parse(fileContent);
    
    // Fix text encoding issues in followers data
    const followersData: InstagramFollower[] = fixEncodingInObject(rawData);
    
    return followersData
      .map(follower => follower.string_list_data)
      .flat()
      .filter(Boolean);
  }

  // Parse following data
  async getFollowing(): Promise<FollowerData[]> {
    const followingPath = path.join(this.dataPath, 'connections/followers_and_following/following.json');
    
    if (!fs.existsSync(followingPath)) {
      throw new Error('Following file not found');
    }

    const fileContent = fs.readFileSync(followingPath, 'utf-8');
    const rawData = JSON.parse(fileContent);
    
    // Fix text encoding issues in following data
    const followingData: InstagramFollowing = fixEncodingInObject(rawData);
    
    return followingData.relationships_following
      .map(relation => relation.string_list_data)
      .flat()
      .filter(Boolean);
  }

  // Get conversations with their metadata including group chat detection
  async getConversationParticipantsWithStatus(): Promise<Map<string, {
    name: string;
    username?: string;
    messageCount: number;
    lastMessageTime: number;
    isGroupChat: boolean;
    participantCount: number;
    participantNames: string[];
  }>> {
    const conversations = await this.getConversations();
    const conversationsStatus = new Map();

    for (const [conversationId, conversation] of conversations) {
      const otherParticipants = conversation.participants.filter(
        p => p.name !== 'Arjun Bhat' // Filter out yourself
      );

      const isGroupChat = otherParticipants.length > 1;
      const lastMessage = conversation.messages[conversation.messages.length - 1];
      
      if (isGroupChat) {
        // For group chats, create one entry with all participant names
        const groupName = otherParticipants.map(p => p.name).join(', ');
        const participantNames = otherParticipants.map(p => p.name);
        
        conversationsStatus.set(conversationId, {
          name: groupName,
          username: '', // Group chats don't have usernames
          messageCount: conversation.messages.length,
          lastMessageTime: lastMessage?.timestamp_ms || 0,
          isGroupChat: true,
          participantCount: otherParticipants.length,
          participantNames
        });
      } else {
        // For individual chats, use the existing logic
        const participant = otherParticipants[0];
        if (participant) {
          let username = '';
          
          // Extract username from conversation ID (format: username_id)
          const match = conversationId.match(/^(.+)_(\d+)$/);
          
          if (match) {
            username = match[1];
            // For pure numeric usernames like "0", we can't determine the actual username
            if (/^\d+$/.test(username)) {
              username = '';
            }
          } else {
            // Fallback for non-standard formats
            username = conversationId;
          }
          
          conversationsStatus.set(conversationId, {
            name: participant.name,
            username,
            messageCount: conversation.messages.length,
            lastMessageTime: lastMessage?.timestamp_ms || 0,
            isGroupChat: false,
            participantCount: 1,
            participantNames: [participant.name]
          });
        }
      }
    }

    return conversationsStatus;
  }
}