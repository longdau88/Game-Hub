"use client";

import { useState, useEffect } from "react";
import { GameCard, Game } from "@/components/shared/GameCard";
import { Search, Library as LibraryIcon, PlayCircle, Heart, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";

const RECENT_GAMES: Game[] = [
  { id: "1", title: "Cyber Racer 3D", creator: "NeonStudios", rating: 4.8, playCount: 15420, thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80", category: "Racing" },
  { id: "3", title: "Puzzle Blocks", creator: "BrainTease", rating: 4.2, playCount: 3200, thumbnail: "https://images.unsplash.com/photo-1614294149010-950b698f72c0?w=800&q=80", category: "Puzzle" },
];

const SAVED_GAMES: Game[] = [
  { id: "4", title: "Space Explorer", creator: "CosmicDev", rating: 4.9, playCount: 42100, thumbnail: "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=800&q=80", category: "Adventure" },
  { id: "2", title: "Fantasy Brawl", creator: "EpicGames", rating: 4.5, playCount: 8930, thumbnail: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80", category: "Action" },
];

export default function LibraryPage() {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="flex flex-col space-y-10 pb-10">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight">My Library</h1>
          <p className="text-muted-foreground mt-1">Your recent plays and saved collections.</p>
        </div>
        
        <div className="relative w-full md:w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            className="w-full pl-9 bg-surface border-border"
            placeholder="Search your library..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <Clock className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-bold">Recently Played</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {RECENT_GAMES.map(game => (
            <GameCard key={game.id} game={game} />
          ))}
          {RECENT_GAMES.length === 0 && (
            <p className="text-muted-foreground">No recent games found.</p>
          )}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <Heart className="w-5 h-5 text-error" />
          <h2 className="text-2xl font-bold">Saved Games</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {SAVED_GAMES.map(game => (
            <GameCard key={game.id} game={game} />
          ))}
          {SAVED_GAMES.length === 0 && (
            <p className="text-muted-foreground">You haven't saved any games yet.</p>
          )}
        </div>
      </section>

    </div>
  );
}
