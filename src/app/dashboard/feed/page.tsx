"use client";
import React, { useEffect, useState } from 'react';

export default function FeedPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function fetchPosts() {
      try {
        const res = await fetch('/api/posts');
        const data = await res.json();
        if (mounted && data.ok) setPosts(data.results || []);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchPosts();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-4">Feed</h1>
        {loading && <p>Loading...</p>}
        {!loading && posts.length === 0 && <p className="text-sm text-gray-500">No posts yet.</p>}

        <div className="space-y-6">
          {posts.map((p) => (
            <article key={p._id} className="bg-white p-4 rounded shadow-sm border">
              <div className="text-sm text-gray-600 mb-2">{p.author ? `User: ${p.author}` : 'Anonymous'}</div>
              {p.text && <div className="mb-3">{p.text}</div>}
              {p.media && p.media.length > 0 && (
                <div className="grid grid-cols-1 gap-2">
                  {p.media.map((m: any, idx: number) => (
                    <div key={idx}>
                      {m.mimeType?.startsWith('image') ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.url} alt={m.filename || 'media'} className="w-full rounded" />
                      ) : (
                        <video controls src={m.url} className="w-full rounded" />
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="text-xs text-gray-400 mt-2">{new Date(p.createdAt).toLocaleString()}</div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
