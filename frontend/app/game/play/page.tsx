"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Maximize2, Share2, Eye, Loader2 } from "lucide-react";
import GameComments from "../../../components/GameComments";
import GameRating from "../../../components/GameRating";

function GamePlayerContent() {
  const searchParams = useSearchParams();
  const gameId = searchParams.get("id");
  
  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId) {
      setLoading(false);
      return;
    }
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    
    // Fetch game details
    fetch(`${apiUrl}/api/games/${gameId}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) setGame(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
      
    // Increment play count
    fetch(`${apiUrl}/api/games/${gameId}/play`, { method: "POST" }).catch(console.error);
  }, [gameId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-24 flex justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
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
          <div className="bg-black rounded-xl overflow-hidden border border-zinc-800 shadow-2xl relative group aspect-video">
            <iframe
              src={r2PublicUrl}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-popups"
              allow="fullscreen"
              title={game.title}
            />
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
              <span className="flex items-center">
                <Eye className="w-4 h-4 mr-1" />
                {game.playCount || 0} Plays
              </span>
              <span>•</span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Link copied to clipboard!");
                }}
                className="flex items-center hover:text-blue-400 transition-colors"
              >
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </button>
            </div>
            
            <div className="mb-8">
              <h3 className="text-sm font-medium text-zinc-400 mb-2">Rate this game</h3>
              <GameRating gameId={gameId!} />
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
            
            <GameComments gameId={gameId!} />
          </div>
        </div>

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

export default function GamePlayer() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">Loading...</div>}>
      <GamePlayerContent />
    </Suspense>
  );
}
