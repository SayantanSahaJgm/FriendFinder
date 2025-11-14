import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";

// In-memory queue for random chat matching (use Redis in production)
const matchingQueue: Map<string, {
  userId: string;
  socketId: string;
  interests: string[];
  gender?: string;
  preferredGender?: string;
  timestamp: number;
}> = new Map();

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { socketId, interests, gender, preferredGender, chatType } = body;

    const currentUser = await User.findOne({ email: session.user.email })
      .select("_id username name profilePicture interests ageRange preferredLanguages")
      .lean();

    if (!currentUser) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    // Add user to matching queue
    const queueEntry = {
      userId: currentUser._id.toString(),
      socketId: socketId || "",
      interests: interests || currentUser.interests || [],
      gender: gender,
      preferredGender: preferredGender,
      timestamp: Date.now()
    };

    // Try to find a match
    let matchFound = false;
    let matchedUser = null;

    for (const [queueUserId, queueData] of matchingQueue.entries()) {
      // Don't match with yourself
      if (queueUserId === currentUser._id.toString()) continue;

      // Check if users have been waiting too long (remove stale entries > 5 min)
      if (Date.now() - queueData.timestamp > 300000) {
        matchingQueue.delete(queueUserId);
        continue;
      }

      // Calculate match score based on interests
      const commonInterests = queueEntry.interests.filter((interest: string) =>
        queueData.interests.includes(interest)
      );

      // Gender preference matching
      const genderMatch = 
        (!queueEntry.preferredGender || queueData.gender === queueEntry.preferredGender) &&
        (!queueData.preferredGender || queueEntry.gender === queueData.preferredGender);

      // Match if they have common interests or no preference set
      if (genderMatch && (commonInterests.length > 0 || queueEntry.interests.length === 0)) {
        matchFound = true;
        
        // Get matched user details
        const matchedUserData = await User.findById(queueUserId)
          .select("username name profilePicture")
          .lean();

        matchedUser = {
          id: queueUserId,
          socketId: queueData.socketId,
          username: matchedUserData?.username,
          name: matchedUserData?.name,
          profilePicture: matchedUserData?.profilePicture,
          commonInterests
        };

        // Remove matched user from queue
        matchingQueue.delete(queueUserId);
        break;
      }
    }

    if (matchFound && matchedUser) {
      return NextResponse.json({
        ok: true,
        matched: true,
        matchedUser,
        currentUser: {
          id: currentUser._id.toString(),
          username: currentUser.username,
          name: currentUser.name,
          profilePicture: currentUser.profilePicture
        }
      });
    } else {
      // Add to queue if no match found
      matchingQueue.set(currentUser._id.toString(), queueEntry);
      
      return NextResponse.json({
        ok: true,
        matched: false,
        message: "Searching for a match...",
        queuePosition: matchingQueue.size
      });
    }

  } catch (err) {
    console.error("/api/random-chat/match error", err);
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : "Failed to find match"
    }, { status: 500 });
  }
}

// Leave matching queue
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const currentUser = await User.findOne({ email: session.user.email }).select("_id").lean();
    if (!currentUser) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    // Remove from queue
    matchingQueue.delete(currentUser._id.toString());

    return NextResponse.json({ ok: true, message: "Left matching queue" });

  } catch (err) {
    console.error("/api/random-chat/match DELETE error", err);
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : "Failed to leave queue"
    }, { status: 500 });
  }
}
