"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Home, Search, PlusSquare, Film, MapPin, Wifi, Bluetooth, User, Camera } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface StoryData {
  userId: string;
  name: string;
  image?: string;
  isYourStory?: boolean;
}

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

function Story({ name, img, isYourStory, onClick }: { name: string; img?: string; isYourStory?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center flex-shrink-0 group">
      <div className="relative">
        <div className={`w-16 h-16 rounded-full overflow-hidden ${!isYourStory ? 'p-[2.5px] bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600' : 'ring-2 ring-gray-300 dark:ring-gray-600'}`}>
          <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-gray-800 p-[2px]">
            {img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={img} alt={name} className="w-full h-full object-cover rounded-full" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white ff-white ff-white text-xl font-bold">{name.charAt(0).toUpperCase()}</span>
              </div>
            )}
          </div>
        </div>
        {isYourStory && (
          <div className="absolute bottom-0 right-0 w-6 h-6 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center border-3 border-white dark:border-gray-800 shadow-lg">
            <span className="text-white ff-white text-sm font-bold">+</span>
          </div>
        )}
      </div>
      <div className="text-xs mt-1.5 truncate w-16 text-center font-medium text-gray-700 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
        {name}
      </div>
    </button>
  );
}

function Post({ author, content, image, likes, comments, timestamp }: any) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg mb-3 shadow-sm">
      {/* Post Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10 ring-2 ring-gray-200 dark:ring-gray-600">
            <AvatarImage src={author.image} alt={author.name} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white ff-white ff-white font-semibold">
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
        <div className="w-full aspect-square bg-gray-100 dark:bg-gray-900">
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
              aria-label={liked ? "Unlike" : "Like"}
            >
              <Heart 
                className={`w-7 h-7 ${liked ? 'fill-red-500 text-red-500' : 'text-gray-900 dark:text-gray-100 hover:text-gray-600'}`} 
              />
            </button>
            <button className="hover:scale-110 transition transform" aria-label="Comment">
              <MessageCircle className="w-7 h-7 text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300" />
            </button>
            <button className="hover:scale-110 transition transform" aria-label="Share">
              <Send className="w-7 h-7 text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300" />
            </button>
          </div>
          <button 
            onClick={() => setSaved(!saved)}
            className="hover:scale-110 transition transform"
            aria-label={saved ? "Unsave" : "Save"}
          >
            <Bookmark 
              className={`w-7 h-7 ${saved ? 'fill-gray-900 dark:fill-gray-100 text-gray-900 dark:text-gray-100' : 'text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300'}`} 
            />
          </button>
        </div>

        {/* Likes Count */}
        <div className="font-bold text-sm mb-2 text-gray-900 dark:text-white ff-white">
          {likes.toLocaleString()} likes
        </div>

        {/* Caption */}
        <div className="text-sm text-gray-900 dark:text-gray-100">
          <span className="font-bold mr-2">{author.name}</span>
          <span className="text-gray-800 dark:text-gray-200">{content}</span>
        </div>

        {/* View Comments */}
        {comments > 0 && (
          <button className="text-sm text-gray-500 dark:text-gray-400 mt-2 hover:text-gray-700 dark:hover:text-gray-300 font-medium">
            View all {comments} comments
          </button>
        )}
      </div>
    </div>
  );
}

export default function Feed() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stories, setStories] = useState<StoryData[]>([]);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real stories and posts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch real posts from API
        const res = await fetch('/api/posts');
        const data = await res.json();
        
        const userStory: StoryData = {
          userId: session?.user?.id || '',
          name: 'Your Story',
          image: session?.user?.image || undefined,
          isYourStory: true
        };
        setStories([userStory]);
        
        // Map API posts to PostData format
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
      } catch (error) {
        console.error('Error fetching feed data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session]);

  return (
    <div className="bg-background text-foreground min-h-screen pb-24">
      {/* Top Header - Improved Contrast */}
      <div className="sticky top-0 bg-card border-b border-border z-40 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button 
            onClick={() => router.push('/dashboard')}
            className="flex items-center space-x-3 hover:opacity-80 transition"
          >
            <Avatar className="w-9 h-9 ring-2 ring-gray-200 dark:ring-gray-600">
              <AvatarImage src={session?.user?.image || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white ff-white ff-white">
                <User className="w-5 h-5" />
              </AvatarFallback>
            </Avatar>
            <h1 className="text-xl font-bold text-foreground">FriendFinder</h1>
          </button>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => router.push('/dashboard/notifications')}
              className="hover:bg-muted p-2 rounded-full transition relative"
              aria-label="Notifications"
            >
              <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full text-white ff-white text-[10px] flex items-center justify-center font-bold shadow-lg">2</span>
            </button>
            <button 
              onClick={() => router.push('/dashboard/messages')}
              className="hover:bg-muted p-2 rounded-full transition"
              aria-label="Messages"
            >
              <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

  <div className="max-w-md mx-auto">
        {/* Stories Section */}
        <div className="border-b border-border bg-card py-4">
          <div className="flex space-x-4 overflow-x-auto px-4 scrollbar-hide">
            {stories.map((story, idx) => (
              <Story 
                key={idx} 
                name={story.name} 
                img={story.image} 
                isYourStory={story.isYourStory}
                onClick={() => {
                  if (story.isYourStory) {
                    router.push('/dashboard/create');
                  }
                }}
              />
            ))}
          </div>
        </div>

        {/* Post Composer */}
        <div className="bg-card border-b border-border p-4 mb-2">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10 ring-2 ring-gray-200 dark:ring-gray-600">
              <AvatarImage src={session?.user?.image || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white ff-white">
                <User className="w-5 h-5" />
              </AvatarFallback>
            </Avatar>
            <button 
              onClick={() => router.push('/dashboard/create')}
              className="flex-1 text-left px-4 py-2.5 bg-secondary rounded-full text-muted-foreground hover:bg-gray-100 transition font-medium"
            >
              What's on your mind?
            </button>
            <button 
              onClick={() => router.push('/dashboard/create')}
              className="p-2.5 hover:bg-muted rounded-full transition"
              aria-label="Add photo"
            >
              <Camera className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </button>
            <button 
              onClick={() => router.push('/dashboard/discover')}
              className="p-2.5 hover:bg-muted rounded-full transition"
              aria-label="Add location"
            >
              <MapPin className="w-5 h-5 text-red-600 dark:text-red-400" />
            </button>
          </div>
        </div>

        {/* Feed */}
        <div className="space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-20 bg-card">
              <div className="flex flex-col items-center space-y-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                <div className="text-muted-foreground font-medium">Loading...</div>
              </div>
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-8 text-center bg-card rounded-lg">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mb-6">
                <Heart className="w-12 h-12 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">No posts yet</h3>
              <p className="text-muted-foreground text-sm mb-8 max-w-xs">
                Follow friends to see their posts in your feed or create your first post to share with others
              </p>
              <button
                onClick={() => router.push('/dashboard/search')}
                className="px-8 py-3 bg-primary hover:bg-blue-700 text-primary-foreground font-semibold rounded-lg transition shadow"
              >
                Find Friends
              </button>
            </div>
          ) : (
            posts.map((post) => (
              <Post key={post.id} {...post} />
            ))
          )}
        </div>
      </div>

      {/* Bottom Navigation - Always Visible */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 shadow-2xl" role="navigation" aria-label="Main navigation">
        <div className="max-w-md mx-auto px-3 py-2 flex items-center justify-around">
          <button 
            onClick={() => router.push('/dashboard/discover')}
            className="flex flex-col items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition min-w-[60px]"
          >
            <MapPin className="w-6 h-6 text-foreground" />
            <span className="text-xs mt-1 text-foreground font-medium">Map</span>
          </button>
          <button 
            onClick={() => router.push('/dashboard/discover?method=bluetooth')}
            className="flex flex-col items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition min-w-[60px]"
          >
            <Bluetooth className="w-6 h-6 text-foreground" />
            <span className="text-xs mt-1 text-foreground font-medium">Bluetooth</span>
          </button>
          <button 
            onClick={() => router.push('/dashboard/discover?method=wifi')}
            className="flex flex-col items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition min-w-[60px]"
          >
            <Wifi className="w-6 h-6 text-foreground" />
            <span className="text-xs mt-1 text-foreground font-medium">WiFi</span>
          </button>
          <button 
            onClick={() => router.push('/dashboard/create')}
            className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white ff-white rounded-full shadow-xl hover:shadow-2xl transition transform hover:scale-110 -mt-8"
            aria-label="Create Post"
          >
            <PlusSquare className="w-7 h-7" />
          </button>
          <button 
            onClick={() => router.push('/dashboard/search')}
            className="flex flex-col items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition min-w-[60px]"
          >
            <Search className="w-6 h-6 text-foreground" />
            <span className="text-xs mt-1 text-foreground font-medium">Search</span>
          </button>
          <button 
            onClick={() => router.push('/dashboard/random-chat')}
            className="flex flex-col items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition min-w-[60px]"
          >
            <Film className="w-6 h-6 text-foreground" />
            <span className="text-xs mt-1 text-foreground font-medium">Random</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

