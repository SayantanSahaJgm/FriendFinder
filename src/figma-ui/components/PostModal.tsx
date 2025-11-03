"use client";
import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function PostModal() {
  const router = useRouter();
  const { data: session } = useSession();
  const [text, setText] = useState("");
  const [media, setMedia] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setMedia(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
  }

  async function submitPost() {
    if (!text && !media) {
      alert("Please add some text or media to post.");
      return;
    }
    setLoading(true);
    try {
  const fd = new FormData();
      fd.append("text", text);
      if (media) fd.append("media", media);
  // include author id when available (optional)
  const authorId = (session as any)?.user?.id || (session as any)?.user?.email || null;
  if (authorId) fd.append("authorId", authorId);
      fd.append("type", "post");

      const res = await fetch("/api/posts", {
        method: "POST",
        body: fd,
      });
      const json = await res.json().catch(() => ({ ok: false, message: 'Server error' } as any));
      if (!res.ok || !json.ok) {
        const msg = json?.message || 'Upload failed';
        alert(msg);
        return;
      }

      // naive success UX: go back to dashboard
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Failed to create post. Check console.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-start justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Create Post</h2>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share something with your friends..."
          className="w-full border rounded-md p-3 h-28 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <div className="mt-3 flex items-center space-x-4">
          <label className="cursor-pointer inline-flex items-center px-3 py-2 bg-slate-100 rounded-md text-sm">
            <input type="file" accept="image/*,video/*" onChange={onFileChange} className="hidden" />
            <span>Add Photo/Video</span>
          </label>

          <button
            onClick={submitPost}
            disabled={loading}
            className="ml-auto bg-gradient-to-r from-blue-500 to-indigo-600 text-white ff-white px-4 py-2 rounded-md shadow hover:opacity-95 disabled:opacity-60"
          >
            {loading ? "Posting..." : "Post"}
          </button>
        </div>

        {preview && (
          <div className="mt-4">
            <div className="border rounded-md overflow-hidden">
              {/* basic preview handling: image or video by file type */}
              {media?.type.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="preview" className="w-full object-cover max-h-72" />
              ) : (
                <video controls src={preview} className="w-full max-h-72" />
              )}
            </div>
            <button
              onClick={() => {
                URL.revokeObjectURL(preview);
                setPreview(null);
                setMedia(null);
              }}
              className="mt-2 text-sm text-red-600"
            >
              Remove
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

