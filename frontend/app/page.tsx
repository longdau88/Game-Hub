"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Play, Gamepad2 } from "lucide-react";

export default function Home() {
  const [games, setGames] = useState<any[]>([]);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    fetch(`${apiUrl}/api/games`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setGames(data);
      })
      .catch(error => console.error("Failed to fetch games", error));
  }, []);

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <section className="mb-16 rounded-2xl bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-zinc-800/60 p-8 md:p-12 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400">
            Discover Your Next Favorite Game
          </h1>
          <p className="text-lg text-zinc-300 mb-8">
            Play high-quality HTML5 web games instantly in your browser. No downloads required.
          </p>
          <div className="flex gap-4">
            <button className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors shadow-[0_0_20px_rgba(37,99,235,0.3)]">
              Browse Store
            </button>
          </div>
        </div>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-40 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"></div>
      </section>

      {/* Featured Games Grid */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">Featured Games</h2>
        </div>
        
        {games.length === 0 ? (
          <div className="text-center py-20 border border-zinc-800/50 border-dashed rounded-xl bg-zinc-900/20">
            <h3 className="text-xl font-medium text-zinc-400 mb-2">Loading games...</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {games.map((game: any) => (
              <div key={game.id} className="group flex flex-col bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 hover:bg-zinc-800/50 transition-all duration-300 transform hover:-translate-y-1">
                {/* Game Cover Placeholder / Image */}
                <div className="aspect-video bg-zinc-800 relative overflow-hidden flex items-center justify-center">
                  {game.coverImageUrl ? (
                    <img src={game.coverImageUrl} alt={game.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-700 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                      <Gamepad2 className="w-12 h-12 text-zinc-600" />
                    </div>
                  )}
                  <Link href={`/game/play?id=${game.id}`}>
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform">
                        <Play className="w-6 h-6 text-white ml-1" />
                      </div>
                    </div>
                  </Link>
                </div>
                
                <div className="p-4 flex-1 flex flex-col">
                  <Link href={`/game/play?id=${game.id}`}>
                    <h3 className="font-bold text-lg mb-1 group-hover:text-blue-400 transition-colors line-clamp-1">
                      {game.title}
                    </h3>
                  </Link>
                  <p className="text-sm text-zinc-400 line-clamp-2 mb-4 flex-1">
                    {game.description || "No description provided."}
                  </p>
                  <div className="text-xs text-zinc-500 mt-auto flex items-center justify-between">
                    <span>{new Date(game.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
