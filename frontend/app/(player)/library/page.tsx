"use client";

import { useState, useEffect } from "react";
import { GameCard, Game } from "@/components/shared/GameCard";
import { Search, Library as LibraryIcon, PlayCircle, Heart, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";

import { fetchAPI } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

export default function LibraryPage() {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [recentGames, setRecentGames] = useState<Game[]>([]);
  const [savedGames, setSavedGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    setMounted(true);
    // Since Library endpoints might not exist yet, we catch errors and set empty.
    Promise.all([
      fetchAPI('/library/recent').catch(() => ({ data: [] })),
      fetchAPI('/library/saved').catch(() => ({ data: [] }))
    ]).then(([recentRes, savedRes]) => {
       const mapGame = (g: any) => ({
          id: g.id,
          title: g.title,
          creator: g.creator?.username || "Unknown",
          rating: g.averageRating || 0,
          playCount: g.playCount || 0,
          thumbnail: g.coverImageUrl || "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&q=80",
          category: g.categories?.[0]?.category?.name || "Uncategorized"
       });
       setRecentGames((recentRes.data || []).map(mapGame));
       setSavedGames((savedRes.data || []).map(mapGame));
    }).finally(() => setLoading(false));
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex flex-col space-y-10 pb-10">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight">{t("my_library") || "My Library"}</h1>
          <p className="text-muted-foreground mt-1">{t("library_subtitle") || "Your recent plays and saved collections."}</p>
        </div>
        
        <div className="relative w-full md:w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            className="w-full pl-9 bg-surface border-border"
            placeholder={t("search_library") || "Search your library..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <Clock className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-bold">{t("recently_played") || "Recently Played"}</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {loading ? (
             <p className="text-muted-foreground col-span-full">{t("loading") || "Loading..."}</p>
          ) : recentGames.length > 0 ? (
            recentGames.map(game => (
              <GameCard key={game.id} game={game} />
            ))
          ) : (
            <div className="col-span-full py-12 text-center border border-dashed border-border rounded-xl">
              <p className="text-muted-foreground font-semibold">{t("not_available") || "Chưa có"}</p>
              <p className="text-sm text-muted-foreground/70">{t("no_recent_games") || "No recent games found."}</p>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <Heart className="w-5 h-5 text-error" />
          <h2 className="text-2xl font-bold">{t("saved_games") || "Saved Games"}</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {loading ? (
             <p className="text-muted-foreground col-span-full">{t("loading") || "Loading..."}</p>
          ) : savedGames.length > 0 ? (
            savedGames.map(game => (
              <GameCard key={game.id} game={game} />
            ))
          ) : (
            <div className="col-span-full py-12 text-center border border-dashed border-border rounded-xl">
              <p className="text-muted-foreground font-semibold">{t("not_available") || "Chưa có"}</p>
              <p className="text-sm text-muted-foreground/70">{t("no_saved_games") || "You haven't saved any games yet."}</p>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
