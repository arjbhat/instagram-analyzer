"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { InstagramConversation, InstagramDataParserClient, FollowerData } from '@/lib/instagram-parser-client';
import { ConversationSentiment } from '@/lib/sentiment-client';

interface InstagramDataContextType {
  isLoaded: boolean;
  conversations: Map<string, InstagramConversation> | null;
  participants: Map<string, unknown> | null;
  followers: FollowerData[] | null;
  following: FollowerData[] | null;
  engagementData: unknown | null;
  searchData: unknown | null;
  postsViewed: unknown[] | null;
  parser: InstagramDataParserClient | null;
  setData: (parser: InstagramDataParserClient) => Promise<void>;
  clearData: () => void;
}

const InstagramDataContext = createContext<InstagramDataContextType | undefined>(undefined);

export function InstagramDataProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [conversations, setConversations] = useState<Map<string, InstagramConversation> | null>(null);
  const [participants, setParticipants] = useState<Map<string, unknown> | null>(null);
  const [followers, setFollowers] = useState<FollowerData[] | null>(null);
  const [following, setFollowing] = useState<FollowerData[] | null>(null);
  const [engagementData, setEngagementData] = useState<unknown | null>(null);
  const [searchData, setSearchData] = useState<unknown | null>(null);
  const [postsViewed, setPostsViewed] = useState<unknown[] | null>(null);
  const [parser, setParser] = useState<InstagramDataParserClient | null>(null);

  const setData = async (newParser: InstagramDataParserClient) => {
    try {
      setParser(newParser);
      
      // Load all data in parallel
      const [
        conversationsData,
        participantsData,
        followersData,
        followingData,
        engagementDataResult,
        searchDataResult,
        postsViewedResult
      ] = await Promise.all([
        newParser.getConversations(),
        newParser.getConversationParticipantsWithStatus(),
        newParser.getFollowers().catch(() => []),
        newParser.getFollowing().catch(() => []),
        newParser.getEngagementData().catch(() => null),
        newParser.getSearchData().catch(() => null),
        newParser.getPostsViewed().catch(() => [])
      ]);

      setConversations(conversationsData);
      setParticipants(participantsData);
      setFollowers(followersData);
      setFollowing(followingData);
      setEngagementData(engagementDataResult);
      setSearchData(searchDataResult);
      setPostsViewed(postsViewedResult);
      setIsLoaded(true);
    } catch (error) {
      console.error('Error loading Instagram data:', error);
      throw error;
    }
  };

  const clearData = () => {
    setIsLoaded(false);
    setConversations(null);
    setParticipants(null);
    setFollowers(null);
    setFollowing(null);
    setEngagementData(null);
    setSearchData(null);
    setPostsViewed(null);
    setParser(null);
  };

  return (
    <InstagramDataContext.Provider
      value={{
        isLoaded,
        conversations,
        participants,
        followers,
        following,
        engagementData,
        searchData,
        postsViewed,
        parser,
        setData,
        clearData,
      }}
    >
      {children}
    </InstagramDataContext.Provider>
  );
}

export function useInstagramData() {
  const context = useContext(InstagramDataContext);
  if (context === undefined) {
    throw new Error('useInstagramData must be used within an InstagramDataProvider');
  }
  return context;
}