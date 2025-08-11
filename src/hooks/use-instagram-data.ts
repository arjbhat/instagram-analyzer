import { useInstagramData as useInstagramDataContext } from '@/contexts/instagram-data-context';

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

export interface InstagramData {
  followers: FollowerData[];
  following: FollowerData[];
  engagement: EngagementData;
  searchData: SearchData;
  postsViewed: PostView[];
}

export function useInstagramData() {
  const context = useInstagramDataContext();
  
  // Transform context data to match the expected format
  const data: InstagramData = {
    followers: context.followers ? context.followers.map(f => ({
      username: f.value,
      timestamp: f.timestamp,
      href: f.href
    })) : [],
    following: context.following ? context.following.map(f => ({
      username: f.value, 
      timestamp: f.timestamp,
      href: f.href
    })) : [],
    engagement: context.engagementData || { likes: [], comments: [], storyLikes: [], saved: [] },
    searchData: context.searchData || { profileSearches: [], wordSearches: [] },
    postsViewed: context.postsViewed || []
  };

  const loading = !context.isLoaded;
  const error = null; // Handle errors through context if needed

  // Calculate derived metrics
  const mutualFollowers = data.followers.filter(f => 
    data.following.some(fw => fw.username === f.username)
  );
  
  const followersOnly = data.followers.filter(f => 
    !data.following.some(fw => fw.username === f.username)
  );
  
  const followingOnly = data.following.filter(f => 
    !data.followers.some(fw => fw.username === f.username)
  );

  const followRatio = data.followers.length > 0 ? (data.following.length / data.followers.length).toFixed(2) : '0';

  return {
    ...data,
    mutualFollowers,
    followersOnly,
    followingOnly,
    followRatio,
    loading,
    error
  };
}