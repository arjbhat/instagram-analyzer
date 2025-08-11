"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GlowingCard } from "@/components/ui/glowing-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Users, Heart, UserCheck, Download, Shield } from "lucide-react";
import { useInstagramData } from "@/hooks/use-instagram-data";
import { UserList } from "@/components/ui/user-list";
import { SearchInput } from "@/components/ui/search-input";
import { ClickableListItem } from "@/components/ui/clickable-list-item";
import { EmptyState } from "@/components/ui/empty-state";
import { ChartCard } from "@/components/ui/chart-card";

export default function AnalyticsPage() {
  const {
    followers,
    following,
    engagement,
    searchData,
    postsViewed,
    mutualFollowers,
    followersOnly,
    followingOnly,
    followRatio,
    loading,
    error,
  } = useInstagramData();

  const [followingOnlySearch, setFollowingOnlySearch] = useState("");
  const [followersOnlySearch, setFollowersOnlySearch] = useState("");

  // Filter and sort data
  const sortedFollowingOnly = followingOnly.sort(
    (a, b) => b.timestamp - a.timestamp
  );
  const sortedFollowersOnly = followersOnly.sort(
    (a, b) => b.timestamp - a.timestamp
  );

  const filteredFollowingOnly = sortedFollowingOnly.filter((user) =>
    user.username.toLowerCase().includes(followingOnlySearch.toLowerCase())
  );

  const filteredFollowersOnly = sortedFollowersOnly.filter((user) =>
    user.username.toLowerCase().includes(followersOnlySearch.toLowerCase())
  );

  const exportData = () => {
    const data = {
      followers,
      following,
      mutualFollowers,
      engagement,
      searchData,
      metrics: {
        followerCount: followers.length,
        followingCount: following.length,
        mutualCount: mutualFollowers.length,
        followRatio,
        totalLikes: engagement.likes.length,
        totalComments: engagement.comments.length,
        totalStoryLikes: engagement.storyLikes.length,
        totalSaved: engagement.saved.length,
      },
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `instagram-analytics-${
      new Date().toISOString().split("T")[0]
    }.json`;
    a.click();
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        {/* Show skeleton layout while loading */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-muted rounded-lg h-24"></div>
            </div>
          ))}
        </div>

        <div className="animate-pulse space-y-4">
          <div className="bg-muted rounded-lg h-12"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-muted rounded-lg h-64"></div>
            <div className="bg-muted rounded-lg h-64"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto p-6">
        {error && (
          <Card className="mb-6 border-destructive/50 bg-destructive/10">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <GlowingCard className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10" />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold tracking-tight text-muted-foreground">
                Followers
              </CardTitle>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Users className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {followers.length.toLocaleString()}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="h-1 flex-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        (mutualFollowers.length / followers.length) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
                <p className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                  {followersOnly.length} not mutual
                </p>
              </div>
            </CardContent>
          </GlowingCard>

          <GlowingCard className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-emerald-500/10" />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold tracking-tight text-muted-foreground">
                Following
              </CardTitle>
              <div className="p-2 bg-green-500/10 rounded-lg">
                <UserCheck className="h-4 w-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold tracking-tight bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {following.length.toLocaleString()}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="h-1 flex-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        (mutualFollowers.length / following.length) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
                <p className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                  {followingOnly.length} one-sided
                </p>
              </div>
            </CardContent>
          </GlowingCard>

          <GlowingCard className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-transparent to-rose-500/10" />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold tracking-tight text-muted-foreground">
                Connections
              </CardTitle>
              <div className="p-2 bg-pink-500/10 rounded-lg">
                <Heart className="h-4 w-4 text-pink-500" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                {mutualFollowers.length.toLocaleString()}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-medium px-2 py-1 bg-pink-500/10 text-pink-600 dark:text-pink-400 rounded-full">
                  {followRatio} ratio
                </span>
                <p className="text-xs font-medium text-muted-foreground">
                  mutual friends
                </p>
              </div>
            </CardContent>
          </GlowingCard>

          <GlowingCard className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-amber-500/10" />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold tracking-tight text-muted-foreground">
                Engagement
              </CardTitle>
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Heart className="h-4 w-4 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                {engagement.likes.length.toLocaleString()}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-medium px-2 py-1 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-full">
                  +{engagement.storyLikes.length} stories
                </span>
                <p className="text-xs font-medium text-muted-foreground">
                  total likes
                </p>
              </div>
            </CardContent>
          </GlowingCard>
        </div>

        <Tabs defaultValue="social" className="space-y-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3">
              <TabsList className="grid w-full grid-cols-4 xs:w-auto xs:flex xs:space-x-1">
                <TabsTrigger
                  value="social"
                  className="text-xs px-2 py-1.5 xs:px-3 xs:py-2"
                >
                  <span className="hidden xs:inline">Social Network</span>
                  <span className="xs:hidden">Social</span>
                </TabsTrigger>
                <TabsTrigger
                  value="engagement"
                  className="text-xs px-2 py-1.5 xs:px-3 xs:py-2"
                >
                  <span className="hidden xs:inline">Engagement</span>
                  <span className="xs:hidden">Likes</span>
                </TabsTrigger>
                <TabsTrigger
                  value="activity"
                  className="text-xs px-2 py-1.5 xs:px-3 xs:py-2"
                >
                  <span className="hidden xs:inline">Activity Patterns</span>
                  <span className="xs:hidden">Activity</span>
                </TabsTrigger>
                <TabsTrigger
                  value="search"
                  className="text-xs px-2 py-1.5 xs:px-3 xs:py-2"
                >
                  <span className="hidden xs:inline">Search Behavior</span>
                  <span className="xs:hidden">Search</span>
                </TabsTrigger>
              </TabsList>
              <Button
                onClick={exportData}
                variant="outline"
                size="sm"
                className="gap-2 w-full xs:w-auto"
              >
                <Download size={14} />
                <span className="hidden xs:inline">Export Data</span>
                <span className="xs:hidden">Export</span>
              </Button>
            </div>
          </div>

          <TabsContent value="social" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ChartCard
                title="One-Sided Follows"
                description={`${
                  followingOnlySearch
                    ? `${filteredFollowingOnly.length} of ${followingOnly.length} accounts`
                    : `${followingOnly.length} accounts`
                } not following back`}
                data={followingOnly as any}
                groupBy="week"
              >
                {followingOnly.length === 0 ? (
                  <EmptyState message="All accounts you follow also follow you back!" />
                ) : (
                  <div className="space-y-3">
                    <SearchInput
                      placeholder="Search accounts..."
                      value={followingOnlySearch}
                      onChange={setFollowingOnlySearch}
                    />
                    {filteredFollowingOnly.length === 0 ? (
                      <EmptyState
                        message={`No accounts found matching "${followingOnlySearch}"`}
                        className="text-center py-4"
                      />
                    ) : (
                      <UserList
                        users={filteredFollowingOnly}
                        emptyMessage="No accounts found"
                      />
                    )}
                  </div>
                )}
              </ChartCard>

              <ChartCard
                title="Non-Mutual Followers"
                description={`${
                  followersOnlySearch
                    ? `${filteredFollowersOnly.length} of ${followersOnly.length} accounts`
                    : `${followersOnly.length} accounts`
                } you don't follow back`}
                data={followersOnly as any}
                groupBy="week"
              >
                {followersOnly.length === 0 ? (
                  <EmptyState message="You follow back all your followers!" />
                ) : (
                  <div className="space-y-3">
                    <SearchInput
                      placeholder="Search followers..."
                      value={followersOnlySearch}
                      onChange={setFollowersOnlySearch}
                    />
                    {filteredFollowersOnly.length === 0 ? (
                      <EmptyState
                        message={`No followers found matching "${followersOnlySearch}"`}
                        className="text-center py-4"
                      />
                    ) : (
                      <UserList
                        users={filteredFollowersOnly}
                        emptyMessage="No followers found"
                      />
                    )}
                  </div>
                )}
              </ChartCard>
            </div>
          </TabsContent>

          <TabsContent value="engagement" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ChartCard
                title="Likes Activity"
                description={`${engagement.likes.length} posts liked`}
                data={engagement.likes as any}
              >
                {engagement.likes.length === 0 ? (
                  <EmptyState message="No liked posts available" />
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {engagement.likes.slice(0, 15).map((like, i) => (
                      <ClickableListItem key={i} href={like.href}>
                        <span className="text-sm">{like.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(like.timestamp * 1000).toLocaleDateString()}
                        </span>
                      </ClickableListItem>
                    ))}
                  </div>
                )}
              </ChartCard>

              <ChartCard
                title="Saved Content"
                description={`${engagement.saved.length} posts saved`}
                data={engagement.saved as any}
              >
                {engagement.saved.length === 0 ? (
                  <EmptyState message="No saved posts available" />
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {engagement.saved.slice(0, 15).map((saved, i) => (
                      <ClickableListItem key={i} href={saved.href}>
                        <span className="text-sm truncate">
                          {saved.title || "Post"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(
                            saved.timestamp * 1000
                          ).toLocaleDateString()}
                        </span>
                      </ClickableListItem>
                    ))}
                  </div>
                )}
              </ChartCard>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <ChartCard
              title="Content Consumption"
              description={`${postsViewed.length} posts viewed`}
              data={postsViewed as any}
              groupBy="week"
            >
              {postsViewed.length === 0 ? (
                <EmptyState message="No posts viewed data available" />
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {postsViewed.slice(0, 20).map((post, i) => (
                    <ClickableListItem
                      key={i}
                      href={`https://www.instagram.com/${post.author}`}
                    >
                      <span className="text-sm">{post.author}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(post.timestamp * 1000).toLocaleString()}
                      </span>
                    </ClickableListItem>
                  ))}
                </div>
              )}
            </ChartCard>
          </TabsContent>

          <TabsContent value="search" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchData.profileSearches.length > 0 && (
                <ChartCard
                  title="Profile Searches"
                  description={`${searchData.profileSearches.length} accounts searched`}
                  data={
                    searchData.profileSearches.map((s) => ({
                      timestamp: s.searchTime,
                      value: s.value,
                    })) as any
                  }
                  className="lg:col-span-2"
                  groupBy="day"
                >
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {searchData.profileSearches
                      .slice(0, 20)
                      .map((search, i) => (
                        <ClickableListItem
                          key={i}
                          href={`https://www.instagram.com/${search.value}`}
                        >
                          <span className="text-sm">{search.value}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(
                              search.searchTime * 1000
                            ).toLocaleDateString()}
                          </span>
                        </ClickableListItem>
                      ))}
                  </div>
                </ChartCard>
              )}

              {searchData.wordSearches.length > 0 && (
                <GlowingCard
                  className={
                    searchData.profileSearches.length > 0 ? "" : "lg:col-span-3"
                  }
                >
                  <CardHeader>
                    <CardTitle>Search Terms</CardTitle>
                    <CardDescription>
                      {searchData.wordSearches.length} keywords searched
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 max-h-[400px] overflow-y-auto">
                      {searchData.wordSearches.slice(0, 30).map((search, i) => (
                        <a
                          key={i}
                          href={`https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(
                            search.value
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-full text-sm transition-colors cursor-pointer"
                        >
                          {search.value}
                        </a>
                      ))}
                    </div>
                  </CardContent>
                </GlowingCard>
              )}
            </div>

            {searchData.profileSearches.length === 0 &&
              searchData.wordSearches.length === 0 && (
                <div className="flex items-center justify-center h-[300px]">
                  <EmptyState message="No search data available in your Instagram export" />
                </div>
              )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
