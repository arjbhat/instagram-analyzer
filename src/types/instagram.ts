// Centralized Instagram data types to avoid duplication

export interface FollowerData {
  username: string;
  timestamp: number;
  href: string;
}

export interface LikeData {
  title: string;
  href: string;
  timestamp: number;
}

export interface CommentData {
  title: string;
  comment: string;
  timestamp: number;
}

export interface StoryLikeData {
  title: string;
  timestamp: number;
}

export interface SavedData {
  title: string;
  href: string;
  timestamp: number;
}

export interface EngagementData {
  likes: LikeData[];
  comments: CommentData[];
  storyLikes: StoryLikeData[];
  saved: SavedData[];
}

export interface ProfileSearch {
  value: string;
  searchTime: number;
}

export interface WordSearch {
  value: string;
  searchTime: number;
}

export interface SearchData {
  profileSearches: ProfileSearch[];
  wordSearches: WordSearch[];
}

export interface PostView {
  author: string;
  timestamp: number;
}

export interface TimeDataPoint {
  timestamp: number;
  [key: string]: unknown;
}

export interface InstagramData {
  followers: FollowerData[];
  following: FollowerData[];
  engagement: EngagementData;
  searchData: SearchData;
  postsViewed: PostView[];
}

export interface InstagramDataWithMetrics extends InstagramData {
  mutualFollowers: FollowerData[];
  followersOnly: FollowerData[];
  followingOnly: FollowerData[];
  followRatio: string;
  loading: boolean;
  error: string | null;
}

// Instagram message interfaces
export interface InstagramMessage {
  sender_name: string;
  timestamp_ms: number;
  content?: string;
  type?: string;
  photos?: Array<{ uri: string }>;
  videos?: Array<{ uri: string }>;
  audio_files?: Array<{ uri: string }>;
}

export interface InstagramConversation {
  id: string;
  participants: Array<{ name: string }>;
  messages: InstagramMessage[];
}