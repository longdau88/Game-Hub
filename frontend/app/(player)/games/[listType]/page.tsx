"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { GameCard, Game } from "@/components/shared/GameCard";
import { fetchAPI } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { Trophy, Star, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function GameListPage() {
  const params = useParams();
  const listType = params?.listType as string; // 'trending' or 'new'
  
  const [mounted, setMounted] = useState(false);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    setMounted(true);
    const loadGames = async () => {
      try {
        const data = await fetchAPI('/games');
        const gamesArray = Array.isArray(data) ? data : (data.data || []);
        let mappedGames = gamesArray.map((g: any) => ({
          id: g.id,
          title: g.title,
          creator: g.uploader?.username || "Unknown",
          rating: g.averageRating || 0,
          playCount: g.playCount || 0,
          thumbnail: g.coverImageUrl || "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&q=80",
          category: g.categories?.[0]?.name || "Uncategorized"
        }));

        if (listType === 'new') {
          mappedGames = mappedGames.reverse();
        } else if (listType === 'trending') {
           // Currently trending is just default order, same as homepage
        }
        
        setGames(mappedGames);
      } catch (err) {
        console.error("Failed to load games:", err);
      } finally {
        setLoading(false);
      }
    };
    
    loadGames();
  }, [listType]);

  if (!mounted) return null;

  const title = listType === 'new' ? (t("new_releases") || "New Releases") : (t("trending_now") || "Trending Now");
  const Icon = listType === 'new' ? Star : Trophy;
  const iconColor = listType === 'new' ? "text-primary" : "text-warning";

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Icon className={`w-8 h-8 ${iconColor}`} />
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {loading ? (
          <p className="text-muted-foreground col-span-full py-10 text-center">{t("loading") || "Loading..."}</p>
        ) : games.length > 0 ? (
          games.map(game => (
            <GameCard key={game.id} game={game} />
          ))
        ) : (
          <div className="col-span-full py-12 text-center border border-dashed border-border rounded-xl">
             <p className="text-muted-foreground font-semibold text-lg">{t("not_available") || "Chưa có"}</p>
             <p className="text-sm text-muted-foreground/70">{t("no_games_found") || "No games currently available in the database."}</p>
          </div>
        )}
      </div>
    </div>
  );
}
