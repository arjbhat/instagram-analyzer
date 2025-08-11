// Client-side Instagram data parser (works with JSZip)
import JSZip from 'jszip';

// Instagram JSON data structure interfaces
interface StringListDataItem {
  value: string;
  timestamp: number;
  href?: string;
}


interface LikesDataItem {
  title: string;
  string_list_data: StringListDataItem[];
}

interface CommentsDataItem {
  title: string;
  string_list_data: StringListDataItem[];
}

interface StoryLikesDataItem {
  title: string;
  string_list_data: StringListDataItem[];
}

interface SavedPostsDataItem {
  title: string;
  string_list_data?: StringListDataItem[];
  string_map_data?: Record<string, { href?: string; timestamp?: number }>;
}

interface ProfileSearchDataItem {
  string_map_data?: {
    Search?: { value: string };
    Time?: { timestamp: number };
  };
}

interface WordSearchDataItem {
  string_map_data?: {
    Search?: { value: string };
    Time?: { timestamp: number };
  };
}

interface PostViewDataItem {
  string_map_data?: {
    Author?: { value: string };
    Time?: { timestamp: number };
  };
}

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

// Fix Instagram's mojibake encoding issues (based on research from Stack Overflow)
function fixTextEncoding(text: string): string {
  if (!text || typeof text !== 'string') return text;
  
  try {
    // Instagram exports have UTF-8 text that was decoded as Latin-1, causing mojibake
    // Convert string to Latin-1 bytes, then decode as UTF-8
    const bytes = [];
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      if (code <= 0xFF) {
        bytes.push(code);
      } else {
        // If we encounter a character > 0xFF, return original
        return text;
      }
    }
    return new TextDecoder('utf-8').decode(new Uint8Array(bytes));
  } catch {
    // If decoding fails, return original string
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

export class InstagramDataParserClient {
  private zip: JSZip;

  constructor(zip: JSZip) {
    this.zip = zip;
  }

  // Parse all message conversations
  async getConversations(): Promise<Map<string, InstagramConversation>> {
    const conversations = new Map<string, InstagramConversation>();
    const messagesBasePath = 'your_instagram_activity/messages/inbox/';
    
    // Find all conversation directories
    const conversationDirs = new Set<string>();
    
    this.zip.forEach((relativePath) => {
      if (relativePath.startsWith(messagesBasePath) && relativePath.includes('message_') && relativePath.endsWith('.json')) {
        // Extract conversation directory name
        const pathAfterInbox = relativePath.substring(messagesBasePath.length);
        const conversationDir = pathAfterInbox.split('/')[0];
        if (conversationDir) {
          conversationDirs.add(conversationDir);
        }
      }
    });

    // Process each conversation
    for (const conversationDir of conversationDirs) {
      const conversationPath = messagesBasePath + conversationDir + '/';
      
      let allMessages: InstagramMessage[] = [];
      let participants: Array<{ name: string }> = [];

      // Find all message files for this conversation
      const messageFiles: string[] = [];
      this.zip.forEach((relativePath) => {
        if (relativePath.startsWith(conversationPath) && 
            relativePath.includes('message_') && 
            relativePath.endsWith('.json')) {
          messageFiles.push(relativePath);
        }
      });

      // Process each message file
      for (const messageFilePath of messageFiles) {
        const file = this.zip.file(messageFilePath);
        if (file) {
          // Read as text (JSZip handles this properly)
          const fileContent = await file.async('text');
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
      }

      // Sort messages by timestamp (oldest first)
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
    const followersPath = 'connections/followers_and_following/followers_1.json';
    const file = this.zip.file(followersPath);
    
    if (!file) {
      throw new Error('Followers file not found');
    }

    const fileContent = await file.async('text');
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
    const followingPath = 'connections/followers_and_following/following.json';
    const file = this.zip.file(followingPath);
    
    if (!file) {
      throw new Error('Following file not found');
    }

    const fileContent = await file.async('text');
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
        p => p.name !== 'Arjun Bhat' // Filter out yourself - TODO: make this configurable
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

  // Get Instagram engagement data
  async getEngagementData() {
    const result = {
      likes: [],
      comments: [],
      storyLikes: [],
      saved: []
    };

    // Load liked posts
    try {
      const likesPath = 'your_instagram_activity/likes/liked_posts.json';
      const likesFile = this.zip.file(likesPath);
      if (likesFile) {
        const likesData = await likesFile.async('text');
        const likesParsed = JSON.parse(likesData);
        
        result.likes = likesParsed.likes_media_likes?.map((item: LikesDataItem) => ({
          title: item.title,
          href: item.string_list_data[0]?.href || '',
          timestamp: item.string_list_data[0]?.timestamp || 0
        })) || [];
      }
    } catch (error) {
      // Silently handle optional data loading failure
      if (process.env.NODE_ENV === 'development') {
        console.warn('Could not load likes:', error);
      }
    }

    // Load comments
    try {
      const commentsPath = 'your_instagram_activity/comments/post_comments_1.json';
      const commentsFile = this.zip.file(commentsPath);
      if (commentsFile) {
        const commentsData = await commentsFile.async('text');
        const commentsParsed = JSON.parse(commentsData);
        
        result.comments = commentsParsed.comments_media_comments?.map((item: CommentsDataItem) => ({
          title: item.title,
          comment: item.string_list_data[0]?.value || '',
          timestamp: item.string_list_data[0]?.timestamp || 0
        })) || [];
      }
    } catch (error) {
      // Silently handle optional data loading failure
      if (process.env.NODE_ENV === 'development') {
        console.warn('Could not load comments:', error);
      }
    }

    // Load story likes
    try {
      const storyLikesPath = 'your_instagram_activity/story_interactions/story_likes.json';
      const storyLikesFile = this.zip.file(storyLikesPath);
      if (storyLikesFile) {
        const storyLikesData = await storyLikesFile.async('text');
        const storyLikesParsed = JSON.parse(storyLikesData);
        
        result.storyLikes = storyLikesParsed.story_activities_story_likes?.map((item: StoryLikesDataItem) => ({
          title: item.title,
          timestamp: item.string_list_data[0]?.timestamp || 0
        })) || [];
      }
    } catch (error) {
      // Silently handle optional data loading failure
      if (process.env.NODE_ENV === 'development') {
        console.warn('Could not load story likes:', error);
      }
    }

    // Load saved posts
    try {
      const savedPath = 'your_instagram_activity/saved/saved_posts.json';
      const savedFile = this.zip.file(savedPath);
      if (savedFile) {
        const savedData = await savedFile.async('text');
        const savedParsed = JSON.parse(savedData);
        
        result.saved = savedParsed.saved_saved_media?.map((item: SavedPostsDataItem) => ({
          title: item.title,
          href: item.string_map_data?.['Saved on']?.href || '',
          timestamp: item.string_map_data?.['Saved on']?.timestamp || 0
        })) || [];
      }
    } catch (error) {
      // Silently handle optional data loading failure
      if (process.env.NODE_ENV === 'development') {
        console.warn('Could not load saved posts:', error);
      }
    }

    return result;
  }

  // Get search data
  async getSearchData() {
    const result = {
      profileSearches: [],
      wordSearches: []
    };

    // Load profile searches
    try {
      const profileSearchPath = 'logged_information/recent_searches/profile_searches.json';
      const profileFile = this.zip.file(profileSearchPath);
      if (profileFile) {
        const profileData = await profileFile.async('text');
        const profileParsed = JSON.parse(profileData);
        
        result.profileSearches = profileParsed.searches_user?.map((item: ProfileSearchDataItem) => ({
          value: item.string_map_data?.Search?.value || '',
          searchTime: item.string_map_data?.Time?.timestamp || 0
        })) || [];
      }
    } catch (error) {
      // Silently handle optional data loading failure
      if (process.env.NODE_ENV === 'development') {
        console.warn('Could not load profile searches:', error);
      }
    }

    // Load word searches
    try {
      const wordSearchPath = 'logged_information/recent_searches/word_or_phrase_searches.json';
      const wordFile = this.zip.file(wordSearchPath);
      if (wordFile) {
        const wordData = await wordFile.async('text');
        const wordParsed = JSON.parse(wordData);
        
        result.wordSearches = wordParsed.searches_keyword?.map((item: WordSearchDataItem) => ({
          value: item.string_map_data?.Search?.value || '',
          searchTime: item.string_map_data?.Time?.timestamp || 0
        })) || [];
      }
    } catch (error) {
      // Silently handle optional data loading failure
      if (process.env.NODE_ENV === 'development') {
        console.warn('Could not load word searches:', error);
      }
    }

    return result;
  }

  // Get posts viewed data
  async getPostsViewed() {
    try {
      const viewsPath = 'ads_information/ads_and_topics/posts_viewed.json';
      const viewsFile = this.zip.file(viewsPath);
      if (viewsFile) {
        const viewsData = await viewsFile.async('text');
        const viewsParsed = JSON.parse(viewsData);
        
        return viewsParsed.impressions_history_posts_seen?.map((item: PostViewDataItem) => ({
          author: item.string_map_data?.Author?.value || '',
          timestamp: item.string_map_data?.Time?.timestamp || 0
        })) || [];
      }
    } catch (error) {
      // Silently handle optional data loading failure
      if (process.env.NODE_ENV === 'development') {
        console.warn('Could not load posts viewed:', error);
      }
    }
    
    return [];
  }
}