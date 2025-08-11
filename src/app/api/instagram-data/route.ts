import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const dataType = searchParams.get('type');
  const uploadedPath = searchParams.get('dataPath');

  const dataDir = uploadedPath || path.join(process.cwd(), 'data');

  try {
    switch (dataType) {
      case 'followers': {
        const followersPath = path.join(dataDir, 'connections/followers_and_following/followers_1.json');
        const data = await fs.readFile(followersPath, 'utf-8');
        const parsed = JSON.parse(data);
        
        const followers = parsed.map((item: any) => ({
          username: item.string_list_data[0]?.value || '',
          timestamp: item.string_list_data[0]?.timestamp || 0,
          href: item.string_list_data[0]?.href || ''
        }));
        
        return NextResponse.json(followers);
      }

      case 'following': {
        const followingPath = path.join(dataDir, 'connections/followers_and_following/following.json');
        const data = await fs.readFile(followingPath, 'utf-8');
        const parsed = JSON.parse(data);
        
        const following = parsed.relationships_following?.map((item: any) => ({
          username: item.string_list_data[0]?.value || '',
          timestamp: item.string_list_data[0]?.timestamp || 0,
          href: item.string_list_data[0]?.href || ''
        })) || [];
        
        return NextResponse.json(following);
      }

      case 'engagement': {
        const result = {
          likes: [],
          comments: [],
          storyLikes: [],
          saved: []
        };

        // Load liked posts
        try {
          const likesPath = path.join(dataDir, 'your_instagram_activity/likes/liked_posts.json');
          const likesData = await fs.readFile(likesPath, 'utf-8');
          const likesParsed = JSON.parse(likesData);
          
          result.likes = likesParsed.likes_media_likes?.map((item: any) => ({
            title: item.title,
            href: item.string_list_data[0]?.href || '',
            timestamp: item.string_list_data[0]?.timestamp || 0
          })) || [];
        } catch {
          console.log('Could not load likes');
        }

        // Load comments
        try {
          const commentsPath = path.join(dataDir, 'your_instagram_activity/comments/post_comments_1.json');
          const commentsData = await fs.readFile(commentsPath, 'utf-8');
          const commentsParsed = JSON.parse(commentsData);
          
          result.comments = commentsParsed.comments_media_comments?.map((item: any) => ({
            title: item.title,
            comment: item.string_list_data[0]?.value || '',
            timestamp: item.string_list_data[0]?.timestamp || 0
          })) || [];
        } catch {
          console.log('Could not load comments');
        }

        // Load story likes
        try {
          const storyLikesPath = path.join(dataDir, 'your_instagram_activity/story_interactions/story_likes.json');
          const storyLikesData = await fs.readFile(storyLikesPath, 'utf-8');
          const storyLikesParsed = JSON.parse(storyLikesData);
          
          result.storyLikes = storyLikesParsed.story_activities_story_likes?.map((item: any) => ({
            title: item.title,
            timestamp: item.string_list_data[0]?.timestamp || 0
          })) || [];
        } catch {
          console.log('Could not load story likes');
        }

        // Load saved posts
        try {
          const savedPath = path.join(dataDir, 'your_instagram_activity/saved/saved_posts.json');
          const savedData = await fs.readFile(savedPath, 'utf-8');
          const savedParsed = JSON.parse(savedData);
          
          result.saved = savedParsed.saved_saved_media?.map((item: any) => ({
            title: item.title,
            href: item.string_map_data?.['Saved on']?.href || '',
            timestamp: item.string_map_data?.['Saved on']?.timestamp || 0
          })) || [];
        } catch {
          console.log('Could not load saved posts');
        }

        return NextResponse.json(result);
      }

      case 'searches': {
        const result = {
          profileSearches: [],
          wordSearches: []
        };

        // Load profile searches
        try {
          const profileSearchPath = path.join(dataDir, 'logged_information/recent_searches/profile_searches.json');
          const profileData = await fs.readFile(profileSearchPath, 'utf-8');
          const profileParsed = JSON.parse(profileData);
          
          result.profileSearches = profileParsed.searches_user?.map((item: any) => ({
            value: item.string_map_data?.Search?.value || '',
            searchTime: item.string_map_data?.Time?.timestamp || 0
          })) || [];
        } catch {
          console.log('Could not load profile searches');
        }

        // Load word searches
        try {
          const wordSearchPath = path.join(dataDir, 'logged_information/recent_searches/word_or_phrase_searches.json');
          const wordData = await fs.readFile(wordSearchPath, 'utf-8');
          const wordParsed = JSON.parse(wordData);
          
          result.wordSearches = wordParsed.searches_keyword?.map((item: any) => ({
            value: item.string_map_data?.Search?.value || '',
            searchTime: item.string_map_data?.Time?.timestamp || 0
          })) || [];
        } catch {
          console.log('Could not load word searches');
        }

        return NextResponse.json(result);
      }

      case 'posts_viewed': {
        try {
          const viewsPath = path.join(dataDir, 'ads_information/ads_and_topics/posts_viewed.json');
          const viewsData = await fs.readFile(viewsPath, 'utf-8');
          const viewsParsed = JSON.parse(viewsData);
          
          const posts = viewsParsed.impressions_history_posts_seen?.map((item: any) => ({
            author: item.string_map_data?.Author?.value || '',
            timestamp: item.string_map_data?.Time?.timestamp || 0
          })) || [];
          
          return NextResponse.json(posts);
        } catch {
          return NextResponse.json([]);
        }
      }

      default:
        return NextResponse.json({ error: 'Invalid data type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error reading Instagram data:', error);
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}