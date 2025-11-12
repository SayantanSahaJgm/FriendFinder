"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Home, Search, PlusSquare, Video, User } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Helper to format timestamp
function formatTimestamp(date: string | Date) {
  const now = new Date();
  const postDate = new Date(date);
  const diffMs = now.getTime() - postDate.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
}

// Story Component
function Story({ name, image, isYourStory, userImage, onClick }: any) {
  return (
    <div className="flex flex-col items-center space-y-1 flex-shrink-0" onClick={onClick}>
      <div
        className={`w-16 h-16 rounded-full p-[2px] ${
          isYourStory
            ? "bg-gray-200"
            : "bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500"
        } cursor-pointer hover:scale-105 transition-transform`}
      >
        <div className="w-full h-full rounded-full bg-white p-[3px]">
          <Avatar className="w-full h-full">
            <AvatarImage src={isYourStory ? userImage : image} alt={name} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
              {name ? name.charAt(0).toUpperCase() : "?"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
      <span className="text-xs text-gray-900 max-w-[64px] truncate">
        {isYourStory ? "Your Story" : name}
      </span>
    </div>
  );
}

// Post Component
function Post({ author, content, image, likes: initialLikes, comments, timestamp, postId }: any) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikes || 0);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
  };

  return (
    <div className="bg-white border-b border-gray-200 mb-4">
      {/* Post Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={author?.profilePicture || author?.image} alt={author?.name || author?.username} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm">
              {(author?.name || author?.username || "U").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-sm text-gray-900">{author?.username || author?.name || "Anonymous"}</span>
            <span className="text-gray-400 text-sm">•</span>
            <span className="text-gray-500 text-sm">{timestamp}</span>
          </div>
        </div>
        <button className="hover:bg-gray-100 p-2 rounded-full transition">
          <MoreHorizontal className="w-5 h-5 text-gray-900" />
        </button>
      </div>

      {/* Post Image */}
      {image && (
        <div className="w-full aspect-square bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="post" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Post Actions */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLike}
              className="hover:opacity-50 transition"
            >
              <Heart
                className={`w-7 h-7 ${
                  liked ? "fill-red-500 text-red-500" : "text-gray-900"
                }`}
              />
            </button>
            <button className="hover:opacity-50 transition">
              <MessageCircle className="w-7 h-7 text-gray-900" />
            </button>
            <button className="hover:opacity-50 transition">
              <Send className="w-7 h-7 text-gray-900" />
            </button>
          </div>
          <button
            onClick={() => setSaved(!saved)}
            className="hover:opacity-50 transition"
          >
            <Bookmark
              className={`w-7 h-7 ${
                saved ? "fill-gray-900 text-gray-900" : "text-gray-900"
              }`}
            />
          </button>
        </div>

        {/* Likes */}
        {likeCount > 0 && (
          <div className="font-semibold text-sm text-gray-900 mb-2">
            {likeCount.toLocaleString()} likes
          </div>
        )}

        {/* Caption */}
        {content && (
          <div className="text-sm text-gray-900">
            <span className="font-semibold mr-2">{author?.username || author?.name || "Anonymous"}</span>
            <span>{content}</span>
          </div>
        )}

        {/* Comments */}
        {comments > 0 && (
          <button className="text-sm text-gray-500 mt-2">
            View all {comments} comments
          </button>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stories, setStories] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch stories and posts from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch stories (only active ones from last 24 hours)
        const storiesRes = await fetch('/api/posts?stories=true');
        const storiesData = await storiesRes.json();
        
        // Fetch posts
        const postsRes = await fetch('/api/posts');
        const postsData = await postsRes.json();
        
        if (storiesData.ok) {
          setStories(storiesData.results || []);
        }
        
        if (postsData.ok) {
          setPosts(postsData.results || []);
        }
      } catch (error) {
        console.error('Error fetching feed data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Show loading while checking auth
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render dashboard content if not authenticated
  if (status === "unauthenticated") {
    return null;
  }

  // Prepare stories list with "Your Story" first
  const storiesDisplay = [
    { 
      name: "Your Story", 
      image: session?.user?.image, 
      isYourStory: true 
    },
    ...stories.map((story: any) => ({
      name: story.author?.username || story.author?.name || "User",
      image: story.author?.profilePicture || story.media?.[0]?.url,
      isYourStory: false,
      storyId: story._id,
    }))
  ];

  return (
    <div className="bg-white min-h-screen pb-20">
      {/* Instagram-style Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "serif" }}>
            FriendFinder
          </h1>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => router.push("/dashboard/messages")}
              className="hover:opacity-50 transition"
            >
              <MessageCircle className="w-6 h-6 text-gray-900" />
            </button>
            <button 
              onClick={() => router.push("/dashboard/notifications")}
              className="hover:opacity-50 transition relative"
            >
              <Heart className="w-6 h-6 text-gray-900" />
              {/* You can add notification count here */}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Stories Section */}
        {storiesDisplay.length > 1 && (
          <div className="px-4 py-4 border-b border-gray-200 bg-white">
            <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
              {storiesDisplay.map((story: any, index: number) => (
                <Story
                  key={index}
                  name={story.name}
                  image={story.image}
                  isYourStory={story.isYourStory}
                  userImage={session?.user?.image}
                  onClick={() => {
                    if (story.isYourStory) {
                      router.push('/dashboard/create?type=story');
                    }
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Posts Feed */}
        <div>
          {posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="text-center">
                <p className="text-gray-500 text-lg mb-2">No posts yet</p>
                <p className="text-gray-400 text-sm">Be the first to share something!</p>
                <button
                  onClick={() => router.push('/dashboard/create')}
                  className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition"
                >
                  Create Post
                </button>
              </div>
            </div>
          ) : (
            posts.map((post: any) => (
              <Post
                key={post._id}
                postId={post._id}
                author={post.author}
                content={post.text}
                image={post.media?.[0]?.url}
                likes={0}
                comments={0}
                timestamp={formatTimestamp(post.createdAt)}
              />
            ))
          )}
        </div>
      </div>

      {/* Instagram-style Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20">
        <div className="max-w-2xl mx-auto px-6 py-2">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex flex-col items-center space-y-1 hover:opacity-50 transition"
            >
              <Home className="w-7 h-7 text-gray-900" />
            </button>
            <button
              onClick={() => router.push("/dashboard/search")}
              className="flex flex-col items-center space-y-1 hover:opacity-50 transition"
            >
              <Search className="w-7 h-7 text-gray-900" />
            </button>
            <button
              onClick={() => router.push("/dashboard/create")}
              className="flex flex-col items-center space-y-1 hover:opacity-50 transition"
            >
              <PlusSquare className="w-7 h-7 text-gray-900" />
            </button>
            <button
              onClick={() => router.push("/dashboard/random-chat")}
              className="flex flex-col items-center space-y-1 hover:opacity-50 transition"
            >
              <Video className="w-7 h-7 text-gray-900" />
            </button>
            <button
              onClick={() => router.push("/dashboard/profile")}
              className="flex flex-col items-center space-y-1 hover:opacity-50 transition"
            >
              <div className="w-7 h-7 rounded-full border-2 border-gray-900 overflow-hidden">
                <Avatar className="w-full h-full">
                  <AvatarImage src={session?.user?.image || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-xs">
                    {session?.user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

