"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Search as SearchIcon, UserPlus, Hash, Clock, Loader2, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

type Result = { id: string; username: string; name?: string; avatar?: string; isFollowing?: boolean; mutual?: number };

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
  const [recent, setRecent] = useState<Result[]>([]);
  const [showRecent, setShowRecent] = useState(true);
  const [activeTab, setActiveTab] = useState<"users" | "posts" | "tags">("users");

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
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        const mapped: Result[] = (data.results || []).map((r: any) => ({
          id: r.id || r._id || r.username,
          username: r.username || r.name || "unknown",
          name: r.name,
          avatar: r.avatar || undefined,
          isFollowing: r.isFollowing || false,
          mutual: r.mutual || 0,
        }));
        setResults(mapped);
      } catch (err) {
        console.error(err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    doSearch();
  }, [debouncedQuery]);

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
      { key: "users", label: "People", icon: <UserPlus className="w-4 h-4" /> },
      { key: "tags", label: "Tags", icon: <Hash className="w-4 h-4" /> },
      { key: "recent", label: "Recent", icon: <Clock className="w-4 h-4" /> },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
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
            <div key={s.key} className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2 text-sm cursor-default">
              <div className="text-primary">{s.icon}</div>
              <div className="font-medium">{s.label}</div>
            </div>
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
          ) : results.length === 0 && debouncedQuery ? (
            <div className="p-6 bg-card rounded text-center text-sm text-muted-foreground">
              No results for <strong className="text-foreground">{debouncedQuery}</strong>
            </div>
          ) : results.length === 0 ? (
            <div>
              {recent.length > 0 ? (
                <div>
                  <h3 className="text-sm font-medium mb-2">Recent searches</h3>
                  <div className="space-y-2">
                    {recent.map((r) => (
                      <button key={r.id} onClick={() => onSelect(r)} className="flex items-center gap-3 w-full p-3 bg-card rounded hover:bg-gray-50">
                        <Avatar className="w-10 h-10">
                          {r.avatar ? <AvatarImage src={r.avatar} alt={r.username} /> : <AvatarFallback>{r.username.charAt(0).toUpperCase()}</AvatarFallback>}
                        </Avatar>
                        <div className="text-left">
                          <div className="font-medium">{r.username}</div>
                          {r.name && <div className="text-xs text-muted-foreground">{r.name}</div>}
                        </div>
                        <div className="ml-auto text-sm text-primary">View</div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-card rounded text-center">
                  <div className="text-sm text-muted-foreground mb-2">Try searching for people or hashtags</div>
                  <div className="flex items-center justify-center gap-3">
                    <div className="text-xs px-3 py-2 bg-muted rounded">@username</div>
                    <div className="text-xs px-3 py-2 bg-muted rounded">#travel</div>
                    <div className="text-xs px-3 py-2 bg-muted rounded">beach</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {results.map((r) => (
                <div key={r.id} className="flex items-center gap-3 p-3 bg-card rounded hover:bg-gray-50">
                  <Avatar className="w-12 h-12">
                    {r.avatar ? <AvatarImage src={r.avatar} alt={r.username} /> : <AvatarFallback>{r.username.charAt(0).toUpperCase()}</AvatarFallback>}
                  </Avatar>
                  <div className="flex-1 text-left">
                    <div className="font-medium">{r.username}</div>
                    {r.name && <div className="text-sm text-muted-foreground">{r.name}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelect(r)}
                      className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
