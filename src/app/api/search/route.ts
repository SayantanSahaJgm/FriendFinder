import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("q") || "";

    // Enhanced demo data with more realistic user profiles
    const demo = [
      { 
        id: "u1", 
        username: "alex_johnson", 
        name: "Alex Johnson",
        avatar: "https://i.pravatar.cc/150?img=12",
        bio: "Travel enthusiast • Photographer 📸",
        isFollowing: false,
        mutual: 3,
        location: "New York, USA"
      },
      { 
        id: "u2", 
        username: "maya_patel", 
        name: "Maya Patel",
        avatar: "https://i.pravatar.cc/150?img=45",
        bio: "Software Engineer @ Tech Co",
        isFollowing: true,
        mutual: 8,
        location: "San Francisco, CA"
      },
      { 
        id: "u3", 
        username: "sam_lee", 
        name: "Sam Lee",
        avatar: "https://i.pravatar.cc/150?img=33",
        bio: "Food blogger 🍕 | Coffee lover ☕",
        isFollowing: false,
        mutual: 0,
        location: "Seoul, South Korea"
      },
      { 
        id: "u4", 
        username: "sarah_wilson", 
        name: "Sarah Wilson",
        avatar: "https://i.pravatar.cc/150?img=47",
        bio: "Digital Artist • Designer 🎨",
        isFollowing: false,
        mutual: 5,
        location: "London, UK"
      },
      { 
        id: "u5", 
        username: "mike_chen", 
        name: "Mike Chen",
        avatar: "https://i.pravatar.cc/150?img=15",
        bio: "Fitness coach | Motivational speaker",
        isFollowing: true,
        mutual: 12,
        location: "Los Angeles, CA"
      },
      { 
        id: "u6", 
        username: "emma_rodriguez", 
        name: "Emma Rodriguez",
        avatar: "https://i.pravatar.cc/150?img=48",
        bio: "Fashion blogger • Style influencer 👗",
        isFollowing: false,
        mutual: 2,
        location: "Miami, FL"
      },
      { 
        id: "u7", 
        username: "david_kim", 
        name: "David Kim",
        avatar: "https://i.pravatar.cc/150?img=60",
        bio: "Gaming streamer 🎮 | Tech reviewer",
        isFollowing: false,
        mutual: 0,
        location: "Tokyo, Japan"
      },
      { 
        id: "u8", 
        username: "olivia_brown", 
        name: "Olivia Brown",
        avatar: "https://i.pravatar.cc/150?img=44",
        bio: "Yoga instructor 🧘‍♀️ | Wellness coach",
        isFollowing: true,
        mutual: 6,
        location: "Austin, TX"
      },
    ];

    // Filter results based on search query
    const results = q
      ? demo.filter((d) => 
          d.username.toLowerCase().includes(q.toLowerCase()) || 
          (d.name || "").toLowerCase().includes(q.toLowerCase()) ||
          (d.bio || "").toLowerCase().includes(q.toLowerCase()) ||
          (d.location || "").toLowerCase().includes(q.toLowerCase())
        )
      : [];

    return NextResponse.json({ ok: true, results });
  } catch (err) {
    console.error("/api/search error", err);
    return NextResponse.json({ ok: false, results: [] }, { status: 500 });
  }
}
