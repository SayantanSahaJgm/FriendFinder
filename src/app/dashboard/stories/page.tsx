import StoriesBar from "@/figma-ui/components/StoriesBar";

export const dynamic = "force-dynamic";

export default function StoriesPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <StoriesBar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-4">Stories</h1>
        <p className="text-sm text-gray-600">Tap any story to view it full screen (demo).</p>
      </div>
    </div>
  );
}
