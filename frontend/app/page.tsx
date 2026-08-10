"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Play, Gamepad2 } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

export default function Home() {
  const { t } = useLanguage();
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
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-blue-600/20 rounded-xl">
            <Gamepad2 className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-3xl font-bold">{t("home.title")}</h1>
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
                </div>
                
                <div className="p-5">
                  <h2 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">{game.title}</h2>
                  <p className="text-zinc-500 text-sm mb-6 line-clamp-2 dark:text-zinc-400">{game.description}</p>
                  
                  <Link 
                    href={`/game/play?id=${game.id}`}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    {t("home.play")}
                  </Link>
                </div>
                <div className="p-4 pt-0 text-xs text-zinc-500 mt-auto flex items-center justify-between">
                  <span>{new Date(game.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
