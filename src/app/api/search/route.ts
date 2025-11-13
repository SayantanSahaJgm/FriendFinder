import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import mongoose from "mongoose";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, results: [], error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const url = new URL(request.url);
    const q = url.searchParams.get("q") || "";
    const type = url.searchParams.get("type") || "all"; // all, users, hashtags, posts
    const limit = parseInt(url.searchParams.get("limit") || "20");

    if (!q || q.trim().length < 1) {
      return NextResponse.json({ ok: true, results: [], hashtags: [], posts: [] });
    }

    const currentUser = await User.findOne({ email: session.user.email }).select("_id friends friendRequests sentRequests");
    if (!currentUser) {
      return NextResponse.json({ ok: false, results: [], error: "User not found" }, { status: 404 });
    }

    const results: any = {
      users: [],
      hashtags: [],
      posts: []
    };

    // Search for users
    if (type === "all" || type === "users") {
      const searchRegex = new RegExp(q.trim(), "i");
      
      const users = await User.find({
        _id: { $ne: currentUser._id }, // Exclude current user
        $or: [
          { username: searchRegex },
          { name: searchRegex },
          { email: searchRegex },
          { bio: searchRegex },
          { interests: { $in: [searchRegex] } }
        ]
      })
      .select("_id username name email profilePicture bio interests isOnline lastSeen friends")
      .limit(limit)
      .lean();

      // Calculate mutual friends and relationship status
      results.users = users.map((user: any) => {
        const userId = user._id.toString();
        const isFriend = currentUser.friends.some((f: any) => f.toString() === userId);
        
        // Check if there's a pending request
        const hasPendingRequestTo = currentUser.sentRequests?.some(
          (req: any) => req.to?.toString() === userId && req.status === 'pending'
        ) || false;
        
        const hasPendingRequestFrom = currentUser.friendRequests?.some(
          (req: any) => req.from?.toString() === userId && req.status === 'pending'
        ) || false;

        // Calculate mutual friends
        const mutualFriends = currentUser.friends.filter((f: any) => 
          user.friends?.some((uf: any) => uf.toString() === f.toString())
        ).length;

        return {
          id: user._id.toString(),
          username: user.username,
          name: user.name || user.username,
          avatar: user.profilePicture,
          bio: user.bio,
          interests: user.interests || [],
          isOnline: user.isOnline,
          lastSeen: user.lastSeen,
          isFriend,
          hasPendingRequestTo,
          hasPendingRequestFrom,
          mutual: mutualFriends
        };
      });
    }

    // Search for hashtags (extract from users' bios and interests)
    if (type === "all" || type === "hashtags") {
      const hashtagRegex = new RegExp(`^${q.trim().replace(/^#/, "")}`, "i");
      
      // Get unique hashtags from user interests
      const usersWithHashtags = await User.find({
        interests: hashtagRegex
      })
      .select("interests")
      .limit(50)
      .lean();

      const hashtagCounts = new Map<string, number>();
      
      usersWithHashtags.forEach((user: any) => {
        user.interests?.forEach((tag: string) => {
          if (hashtagRegex.test(tag)) {
            const normalizedTag = tag.toLowerCase();
            hashtagCounts.set(normalizedTag, (hashtagCounts.get(normalizedTag) || 0) + 1);
          }
        });
      });

      // Also search in bios for hashtags
      const biosWithHashtags = await User.find({
        bio: new RegExp(`#${q.trim().replace(/^#/, "")}`, "i")
      })
      .select("bio")
      .limit(50)
      .lean();

      biosWithHashtags.forEach((user: any) => {
        const bioHashtags = user.bio?.match(/#[\w]+/g) || [];
        bioHashtags.forEach((tag: string) => {
          const cleanTag = tag.substring(1).toLowerCase();
          if (hashtagRegex.test(cleanTag)) {
            hashtagCounts.set(cleanTag, (hashtagCounts.get(cleanTag) || 0) + 1);
          }
        });
      });

      results.hashtags = Array.from(hashtagCounts.entries())
        .map(([tag, count]) => ({ tag: `#${tag}`, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    }

    // For posts search - placeholder for future implementation
    if (type === "all" || type === "posts") {
      // TODO: Implement posts search when Post model is created
      results.posts = [];
    }

    // Return combined results based on type
    if (type === "all") {
      return NextResponse.json({ 
        ok: true, 
        results: results.users,
        hashtags: results.hashtags,
        posts: results.posts
      });
    } else if (type === "users") {
      return NextResponse.json({ ok: true, results: results.users });
    } else if (type === "hashtags") {
      return NextResponse.json({ ok: true, hashtags: results.hashtags });
    } else {
      return NextResponse.json({ ok: true, posts: results.posts });
    }

  } catch (err) {
    console.error("/api/search error", err);
    return NextResponse.json({ 
      ok: false, 
      results: [], 
      error: err instanceof Error ? err.message : "Search failed" 
    }, { status: 500 });
  }
}
