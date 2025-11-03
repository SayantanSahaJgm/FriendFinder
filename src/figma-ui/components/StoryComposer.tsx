"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function StoryComposer({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [media, setMedia] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setMedia(file);
    setPreview(URL.createObjectURL(file));
  }

  async function submitStory() {
    if (!media) {
      alert("Please choose a photo or video for your story.");
      return;
    }
    setLoading(true);
    try {
  const fd = new FormData();
  fd.append("media", media);
  const authorId = (session as any)?.user?.id || (session as any)?.user?.email || null;
  if (authorId) fd.append('authorId', authorId);
  fd.append("type", "story");

      const res = await fetch("/api/posts", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({ ok: false, message: 'Server error' } as any));
      if (!res.ok || !json.ok) {
        alert(json?.message || 'Upload failed');
        return;
      }
      onClose?.();
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to upload story.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-sm font-medium mb-2">Add Story</h3>
      <label className="cursor-pointer inline-flex items-center px-3 py-2 bg-slate-100 rounded-md text-sm">
        <input type="file" accept="image/*,video/*" onChange={onFileChange} className="hidden" />
        <span>Choose Photo/Video</span>
      </label>

      {preview && (
        <div className="mt-3">
          {media?.type.startsWith("image/") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="story preview" className="w-40 h-72 object-cover rounded-md" />
          ) : (
            <video src={preview} className="w-40 h-72 rounded-md" controls />
          )}
        </div>
      )}

      <div className="mt-3 flex items-center space-x-2">
  <button onClick={submitStory} disabled={loading} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white ff-white px-3 py-1 rounded">
          {loading ? "Uploading..." : "Share Story"}
        </button>
        <button onClick={() => onClose?.()} className="text-sm text-gray-600">Cancel</button>
      </div>
    </div>
  );
}

