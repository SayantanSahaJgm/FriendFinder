"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Search as SearchIcon, UserPlus, Hash, Clock, Loader2, X, TrendingUp, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Result = { 
  id: string; 
  username: string; 
  name?: string; 
  avatar?: string; 
  bio?: string;
  interests?: string[];
  isOnline?: boolean;
  isFriend?: boolean; 
  hasPendingRequestTo?: boolean;
  hasPendingRequestFrom?: boolean;
  mutual?: number 
};

type Hashtag = { tag: string; count: number };

function useDebounce<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [hashtags, setHashtags] = useState<Hashtag[]>([]);
  const [recent, setRecent] = useState<Result[]>([]);
  const [showRecent, setShowRecent] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "users" | "hashtags">("all");

  useEffect(() => {
    try {
      const s = sessionStorage.getItem("ff_recent_searches");
      if (s) setRecent(JSON.parse(s));
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    const doSearch = async () => {
      if (!debouncedQuery || debouncedQuery.trim().length < 1) {
        setResults([]);
        setHashtags([]);
        setLoading(false);
        setShowRecent(true);
        return;
      }

      setLoading(true);
      setShowRecent(false);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&type=${activeTab}`);
        if (!res.ok) {
          throw new Error("Search failed");
        }
        const data = await res.json();
        
        if (data.ok) {
          setResults(data.results || []);
          setHashtags(data.hashtags || []);
        } else {
          toast.error(data.error || "Search failed");
          setResults([]);
          setHashtags([]);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to search. Please try again.");
        setResults([]);
        setHashtags([]);
      } finally {
        setLoading(false);
      }
    };

    doSearch();
  }, [debouncedQuery, activeTab]);

  const saveRecent = (r: Result) => {
    try {
      const updated = [r, ...recent.filter((x) => x.id !== r.id)].slice(0, 6);
      setRecent(updated);
      sessionStorage.setItem("ff_recent_searches", JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
  };

  const onSelect = (r: Result) => {
    saveRecent(r);
    router.push(`/dashboard/profile/${r.id}`);
  };

  const handleClearInput = () => setQuery("");

  const suggestionItems = useMemo(
    () => [
      { key: "all", label: "All", icon: <SearchIcon className="w-4 h-4" /> },
      { key: "users", label: "People", icon: <Users className="w-4 h-4" /> },
      { key: "hashtags", label: "Tags", icon: <Hash className="w-4 h-4" /> },
    ],
    []
  );

  const handleTabClick = (key: string) => {
    setActiveTab(key as "all" | "users" | "hashtags");
  };

  const handleHashtagClick = (tag: string) => {
    setQuery(tag);
    setActiveTab("users");
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="mb-4">
          <h2 className="text-2xl font-semibold">Search</h2>
          <p className="text-sm text-muted-foreground">Find people, hashtags, and posts.</p>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <label htmlFor="ff-search" className="sr-only">Search</label>
          <div className="flex items-center gap-2 flex-1 bg-muted rounded-lg px-3 py-2">
            <SearchIcon className="w-5 h-5 text-muted-foreground" />
            <input
              id="ff-search"
              className="w-full bg-transparent outline-none placeholder:opacity-70"
              placeholder="Search users, hashtags, or keywords"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            {query && (
              <button
                aria-label="Clear"
                className="text-sm text-muted-foreground hover:opacity-80"
                onClick={handleClearInput}
              >
                Clear
              </button>
            )}
          </div>
          <button
            onClick={() => setQuery("")}
            className="px-3 py-2 bg-primary text-primary-foreground rounded-lg font-medium"
          >
            Reset
          </button>
        </div>

        <div className="mb-4 flex items-center gap-3">
          {suggestionItems.map((s) => (
            <button
              key={s.key}
              onClick={() => handleTabClick(s.key)}
              className={`flex items-center gap-2 border rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors ${
                activeTab === s.key
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card border-border hover:bg-muted'
              }`}
            >
              <div>{s.icon}</div>
              <div className="font-medium">{s.label}</div>
            </button>
          ))}
        </div>

        <div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-center gap-3 p-3 bg-card rounded">
                  <div className="w-12 h-12 bg-muted rounded-full" />
                  <div className="flex-1">
                    <div className="h-3 bg-muted rounded w-3/5 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : showRecent && results.length === 0 && !debouncedQuery ? (
            <div>
              {recent.length > 0 ? (
                <div>
                  <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Recent searches
                  </h3>
                  <div className="space-y-2">
                    {recent.map((r) => (
                      <button key={r.id} onClick={() => onSelect(r)} className="flex items-center gap-3 w-full p-3 bg-card rounded hover:bg-muted transition-colors">
                        <Avatar className="w-10 h-10">
                          {r.avatar ? <AvatarImage src={r.avatar} alt={r.username} /> : <AvatarFallback>{r.username?.charAt(0).toUpperCase() || "?"}</AvatarFallback>}
                        </Avatar>
                        <div className="text-left flex-1">
                          <div className="font-medium">{r.username}</div>
                          {r.name && <div className="text-xs text-muted-foreground">{r.name}</div>}
                        </div>
                        <div className="text-sm text-primary">View</div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-card rounded text-center">
                  <SearchIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <div className="text-sm text-muted-foreground mb-2">Try searching for people or hashtags</div>
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    <div className="text-xs px-3 py-2 bg-muted rounded">@username</div>
                    <div className="text-xs px-3 py-2 bg-muted rounded">#travel</div>
                    <div className="text-xs px-3 py-2 bg-muted rounded">#photography</div>
                  </div>
                </div>
              )}
            </div>
          ) : results.length === 0 && hashtags.length === 0 && debouncedQuery ? (
            <div className="p-6 bg-card rounded text-center text-sm text-muted-foreground">
              No results for <strong className="text-foreground">{debouncedQuery}</strong>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Hashtags section */}
              {hashtags.length > 0 && (activeTab === "all" || activeTab === "hashtags") && (
                <div>
                  <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Hashtags
                  </h3>
                  <div className="space-y-2">
                    {hashtags.map((h) => (
                      <button
                        key={h.tag}
                        onClick={() => handleHashtagClick(h.tag)}
                        className="flex items-center justify-between w-full p-3 bg-card rounded hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Hash className="w-5 h-5 text-primary" />
                          </div>
                          <div className="text-left">
                            <div className="font-medium">{h.tag}</div>
                            <div className="text-xs text-muted-foreground">{h.count} {h.count === 1 ? 'user' : 'users'}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Users section */}
              {results.length > 0 && (activeTab === "all" || activeTab === "users") && (
                <div>
                  {hashtags.length > 0 && activeTab === "all" && (
                    <h3 className="text-sm font-medium mb-2 flex items-center gap-2 mt-4">
                      <Users className="w-4 h-4" />
                      People
                    </h3>
                  )}
                  <div className="space-y-2">
                    {results.map((r) => (
                      <div key={r.id} className="flex items-center gap-3 p-3 bg-card rounded hover:bg-muted transition-colors">
                        <Avatar className="w-12 h-12">
                          {r.avatar ? <AvatarImage src={r.avatar} alt={r.username} /> : <AvatarFallback>{r.username?.charAt(0).toUpperCase() || "?"}</AvatarFallback>}
                        </Avatar>
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <div className="font-medium">{r.username}</div>
                            {r.isOnline && <div className="w-2 h-2 bg-green-500 rounded-full" />}
                          </div>
                          {r.name && r.name !== r.username && <div className="text-sm text-muted-foreground">{r.name}</div>}
                          {r.bio && <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{r.bio}</div>}
                          {r.mutual ? (
                            <div className="text-xs text-muted-foreground mt-1">{r.mutual} mutual {r.mutual === 1 ? 'friend' : 'friends'}</div>
                          ) : null}
                          {r.interests && r.interests.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {r.interests.slice(0, 3).map((interest, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">{interest}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {r.isFriend ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-700">Friends</Badge>
                          ) : r.hasPendingRequestTo ? (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">Pending</Badge>
                          ) : r.hasPendingRequestFrom ? (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700">Respond</Badge>
                          ) : null}
                          <button
                            onClick={() => onSelect(r)}
                            className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
