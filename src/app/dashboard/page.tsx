"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Home, Search, PlusSquare, Video, User } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Sample stories data
const sampleStories = [
  { name: "Your Story", image: null, isYourStory: true },
  { name: "sarah_chen", image: "/images/sample1.jpg" },
  { name: "alex_parker", image: "/images/sample2.jpg" },
  { name: "maya_singh", image: "/images/sample3.jpg" },
  { name: "john_doe", image: "/images/sample4.jpg" },
  { name: "emma_wilson", image: "/images/sample5.jpg" },
];

// Sample posts data
const samplePosts = [
  {
    id: "1",
    author: { name: "sarah_chen", image: "/images/sample1.jpg" },
    content: "Living my best life at the beach! 🏖️ #beachvibes #sunset",
    image: "/images/post1.jpg",
    likes: 1234,
    comments: 48,
    timestamp: "1 day ago",
  },
  {
    id: "2",
    author: { name: "alex_parker", image: "/images/sample2.jpg" },
    content: "Amazing coffee and great vibes ☕✨",
    image: "/images/post2.jpg",
    likes: 892,
    comments: 23,
    timestamp: "1 day ago",
  },
  {
    id: "3",
    author: { name: "maya_singh", image: "/images/sample3.jpg" },
    content: "Sunset views from the rooftop 🌆 #citylife #photography",
    image: "/images/post3.jpg",
    likes: 2156,
    comments: 67,
    timestamp: "1 day ago",
  },
  {
    id: "4",
    author: { name: "john_doe", image: "/images/sample4.jpg" },
    content: "Adventure time! 🏔️ #hiking #nature #explore",
    image: "/images/post4.jpg",
    likes: 1543,
    comments: 34,
    timestamp: "1 day ago",
  },
];

// Story Component
function Story({ name, image, isYourStory, userImage }: any) {
  return (
    <div className="flex flex-col items-center space-y-1 flex-shrink-0">
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
              {name.charAt(0).toUpperCase()}
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
function Post({ author, content, image, likes, comments, timestamp }: any) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);

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
            <AvatarImage src={author.image} alt={author.name} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm">
              {author.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-sm text-gray-900">{author.name}</span>
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
        <div className="font-semibold text-sm text-gray-900 mb-2">
          {likeCount.toLocaleString()} likes
        </div>

        {/* Caption */}
        <div className="text-sm text-gray-900">
          <span className="font-semibold mr-2">{author.name}</span>
          <span>{content}</span>
        </div>

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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Show loading while checking auth
  if (status === "loading") {
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

  return (
    <div className="bg-white min-h-screen pb-20">
      {/* Instagram-style Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "serif" }}>
            FriendFinder
          </h1>
          <div className="flex items-center space-x-4">
            <button className="hover:opacity-50 transition">
              <MessageCircle className="w-6 h-6 text-gray-900" />
            </button>
            <button className="hover:opacity-50 transition relative">
              <Heart className="w-6 h-6 text-gray-900" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                3
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Stories Section */}
        <div className="px-4 py-4 border-b border-gray-200 bg-white">
          <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
            {sampleStories.map((story, index) => (
              <Story
                key={index}
                {...story}
                userImage={session?.user?.image}
              />
            ))}
          </div>
        </div>

        {/* Posts Feed */}
        <div>
          {samplePosts.map((post) => (
            <Post key={post.id} {...post} />
          ))}
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

