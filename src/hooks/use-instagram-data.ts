import { useState, useEffect } from 'react';

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
  const [data, setData] = useState<InstagramData>({
    followers: [],
    following: [],
    engagement: { likes: [], comments: [], storyLikes: [], saved: [] },
    searchData: { profileSearches: [], wordSearches: [] },
    postsViewed: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [followersResp, followingResp, engagementResp, searchResp, viewsResp] = await Promise.all([
        fetch('/api/instagram-data?type=followers'),
        fetch('/api/instagram-data?type=following'),
        fetch('/api/instagram-data?type=engagement'),
        fetch('/api/instagram-data?type=searches'),
        fetch('/api/instagram-data?type=posts_viewed')
      ]);

      const newData: InstagramData = {
        followers: followersResp.ok ? await followersResp.json() : [],
        following: followingResp.ok ? await followingResp.json() : [],
        engagement: engagementResp.ok ? await engagementResp.json() : { likes: [], comments: [], storyLikes: [], saved: [] },
        searchData: searchResp.ok ? await searchResp.json() : { profileSearches: [], wordSearches: [] },
        postsViewed: viewsResp.ok ? await viewsResp.json() : []
      };

      setData(newData);
    } catch {
      setError('Failed to load Instagram data. Please ensure your data export is in the /data folder.');
    } finally {
      setLoading(false);
    }
  };

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
    error,
    reload: loadAllData
  };
}