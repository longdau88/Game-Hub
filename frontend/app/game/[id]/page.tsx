import Link from "next/link";
import { ArrowLeft, Maximize2, Share2, ThumbsUp } from "lucide-react";

export default async function GamePlayer({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const gameId = resolvedParams.id;
  
  let game = null;
  try {
    const res = await fetch(`http://localhost:4000/api/games/${gameId}`, { cache: 'no-store' });
    if (res.ok) {
      game = await res.json();
    }
  } catch (error) {
    console.error("Failed to fetch game details", error);
  }

  if (!game) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-3xl font-bold mb-4">Game Not Found</h1>
        <p className="text-zinc-400 mb-8">The game you are looking for does not exist or has been removed.</p>
        <Link href="/" className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium">
          Return to Store
        </Link>
      </div>
    );
  }

  // The Cloudflare R2 public URL
  // Replace pub-xxxx.r2.dev with the actual custom domain or dev url if configured
  const r2PublicUrl = `https://pub-xxxx.r2.dev/games/${gameId}/index.html`;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Store
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Game Player Area */}
          <div className="bg-black rounded-xl overflow-hidden border border-zinc-800 shadow-2xl relative group aspect-video">
            <iframe
              src={r2PublicUrl}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-popups"
              allow="fullscreen"
              title={game.title}
            />
            {/* Overlay controls */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <button className="p-2 bg-black/60 hover:bg-black/80 rounded-md backdrop-blur-sm border border-white/10 text-white transition-colors" title="Fullscreen">
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-bold mb-2">{game.title}</h1>
            <div className="flex items-center gap-4 text-sm text-zinc-400 mb-6 border-b border-zinc-800/50 pb-6">
              <span>Published on {new Date(game.createdAt).toLocaleDateString()}</span>
              <span>•</span>
              <button className="flex items-center hover:text-blue-400 transition-colors">
                <ThumbsUp className="w-4 h-4 mr-1" />
                Like
              </button>
              <span>•</span>
              <button className="flex items-center hover:text-blue-400 transition-colors">
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </button>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold mb-3">About this game</h2>
              <div className="text-zinc-300 leading-relaxed space-y-4">
                {game.description ? (
                  <p>{game.description}</p>
                ) : (
                  <p className="italic text-zinc-500">No description provided for this game.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h3 className="font-medium text-lg mb-4 text-white">Controls</h3>
            <div className="space-y-3 text-sm text-zinc-400">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-800/50">
                <span>Movement</span>
                <span className="font-mono bg-zinc-800 px-2 py-1 rounded text-zinc-300">W A S D</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-zinc-800/50">
                <span>Action</span>
                <span className="font-mono bg-zinc-800 px-2 py-1 rounded text-zinc-300">Space</span>
              </div>
            </div>
            <p className="text-xs text-zinc-500 mt-4 italic">Controls may vary by game. Check in-game tutorial.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
