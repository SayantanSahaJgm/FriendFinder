"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Camera, MapPin } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";
import StoriesBar from "@/figma-ui/components/StoriesBar";

interface PostData {
  id: string;
  author: {
    id: string;
    name: string;
    image?: string;
  };
  content: string;
  image?: string;
  likes: number;
  comments: number;
  timestamp: string;
  isLiked?: boolean;
  isSaved?: boolean;
}

function Post({ author, content, image, likes, comments, timestamp }: any) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
  <div className="bg-white border border-gray-200 rounded-lg mb-3 shadow-sm">
      {/* Post Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10 ring-2 ring-gray-200 dark:ring-gray-600">
            <AvatarImage src={author.image} alt={author.name} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white ff-white font-semibold">
              {author.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-bold text-sm text-gray-900 dark:text-white ff-white">{author.name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{timestamp}</div>
          </div>
        </div>
        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition">
          <MoreHorizontal className="w-5 h-5 text-gray-700 dark:text-gray-200" />
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
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-5">
            <button 
              onClick={() => setLiked(!liked)}
              className="hover:scale-110 transition transform"
            >
              <Heart 
                className={`w-7 h-7 ${liked ? 'fill-red-500 text-red-500' : 'text-gray-900 dark:text-gray-100'}`} 
              />
            </button>
            <button className="hover:scale-110 transition transform">
              <MessageCircle className="w-7 h-7 text-gray-900 dark:text-gray-100" />
            </button>
            <button className="hover:scale-110 transition transform">
              <Send className="w-7 h-7 text-gray-900 dark:text-gray-100" />
            </button>
          </div>
          <button 
            onClick={() => setSaved(!saved)}
            className="hover:scale-110 transition transform"
          >
            <Bookmark 
              className={`w-7 h-7 ${saved ? 'fill-gray-900 dark:fill-gray-100' : ''} text-gray-900 dark:text-gray-100`} 
            />
          </button>
        </div>

        <div className="font-bold text-sm mb-2 text-gray-900 dark:text-white ff-white">
          {likes.toLocaleString()} likes
        </div>

        <div className="text-sm text-gray-900 dark:text-gray-100">
          <span className="font-bold mr-2">{author.name}</span>
          <span className="text-gray-800 dark:text-gray-200">{content}</span>
        </div>

        {comments > 0 && (
          <button className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">
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
  const toast = useToast();
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch posts
  useEffect(() => {
    // Only fetch if authenticated
    if (status !== "authenticated") {
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/posts');
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to fetch posts (${res.status})`);
        }
        
        const data = await res.json();
        
        const mappedPosts: PostData[] = (data.results || []).map((p: any) => ({
          id: p._id,
          author: {
            id: p.author || 'anon',
            name: p.author || 'Anonymous',
            image: undefined,
          },
          content: p.text || '',
          image: p.media && p.media.length > 0 ? p.media[0].url : undefined,
          likes: Math.floor(Math.random() * 100),
          comments: Math.floor(Math.random() * 20),
          timestamp: new Date(p.createdAt).toLocaleDateString(),
          isLiked: false,
          isSaved: false,
        }));
        setPosts(mappedPosts);
        
        // Show success message if there are posts
        if (mappedPosts.length > 0) {
          toast.success('Feed loaded', `${mappedPosts.length} posts loaded successfully`);
        }
      } catch (error) {
        console.error('Error fetching feed data:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load feed';
        setError(errorMessage);
        toast.error('Failed to load feed', errorMessage);
        // Set empty posts on error instead of crashing
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [status, toast]);

  // Show loading while checking auth
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render dashboard content if not authenticated
  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="bg-white min-h-screen pb-6">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Stories Section */}
        <div className="mb-6">
          <StoriesBar />
        </div>

        {/* Post Composer */}
  <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10 ring-2 ring-gray-200 dark:ring-gray-600">
              <AvatarImage src={session?.user?.image || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white ff-white font-semibold">
                {session?.user?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <button 
              onClick={() => router.push('/dashboard/create')}
              className="flex-1 text-left px-4 py-2.5 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition font-medium"
            >
              What's on your mind?
            </button>
            <button 
              onClick={() => router.push('/dashboard/create')}
              className="p-2.5 hover:bg-gray-100 rounded-full transition"
            >
              <Camera className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </button>
            <button 
              onClick={() => router.push('/dashboard/discover')}
              className="p-2.5 hover:bg-gray-100 rounded-full transition"
            >
              <MapPin className="w-5 h-5 text-red-600 dark:text-red-400" />
            </button>
          </div>
        </div>

        {/* Feed */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-20 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="flex flex-col items-center space-y-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                <div className="text-gray-600 font-medium">Loading your feed...</div>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 px-8 text-center bg-white rounded-lg border border-red-200 shadow-sm">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center mb-6">
                <MessageCircle className="w-12 h-12 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Failed to Load Feed</h3>
              <p className="text-gray-600 text-sm mb-2 max-w-md">
                {error}
              </p>
              <p className="text-gray-500 text-xs mb-6">
                Please check your internet connection and try again.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white ff-white font-semibold rounded-lg transition shadow-lg"
              >
                Try Again
              </button>
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-8 text-center bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mb-6">
                <Heart className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">No posts yet</h3>
              <p className="text-gray-600 text-sm mb-8 max-w-xs">
                Follow friends to see their posts in your feed or create your first post to share with others
              </p>
              <button
                onClick={() => router.push('/dashboard/create')}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white ff-white font-semibold rounded-lg transition shadow-lg"
              >
                Create Your First Post
              </button>
            </div>
          ) : (
            posts.map((post) => (
              <Post key={post.id} {...post} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

