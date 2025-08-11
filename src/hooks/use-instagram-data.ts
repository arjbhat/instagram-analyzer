import { useInstagramData as useInstagramDataContext } from '@/contexts/instagram-data-context';
import type {
  FollowerData,
  LikeData,
  CommentData,
  StoryLikeData,
  SavedData,
  EngagementData,
  ProfileSearch,
  WordSearch,
  SearchData,
  PostView,
  InstagramData,
  InstagramDataWithMetrics
} from '@/types/instagram';

// Re-export types for other modules
export type {
  FollowerData,
  LikeData,
  CommentData,
  StoryLikeData,
  SavedData,
  EngagementData,
  ProfileSearch,
  WordSearch,
  SearchData,
  PostView,
  InstagramData,
  InstagramDataWithMetrics
};

export function useInstagramData(): InstagramDataWithMetrics {
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
    engagement: (context.engagementData as EngagementData) ?? { likes: [], comments: [], storyLikes: [], saved: [] },
    searchData: (context.searchData as SearchData) ?? { profileSearches: [], wordSearches: [] },
    postsViewed: (context.postsViewed as PostView[]) ?? []
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