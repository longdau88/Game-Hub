"use client";

import { useState, useEffect } from "react";
import { GameCard, Game } from "@/components/shared/GameCard";
import { XPProgress } from "@/components/shared/XPProgress";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Search, Flame, Trophy, Star, ChevronRight } from "lucide-react";



import { fetchAPI } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

export default function PlayerHome() {
  const [mounted, setMounted] = useState(false);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const { t } = useLanguage();

  useEffect(() => {
    setMounted(true);
    
    // Fetch real games from backend
    const loadGames = async () => {
      try {
        const data = await fetchAPI('/games');
        // Adapt backend data to frontend Game interface
        const gamesArray = Array.isArray(data) ? data : (data.data || []);
        const mappedGames = gamesArray.map((g: any) => ({
          id: g.id,
          title: g.title,
          creator: g.uploader?.username || "Unknown",
          rating: g.averageRating || 0,
          playCount: g.playCount || 0,
          thumbnail: g.coverImageUrl || "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&q=80",
          category: g.categories?.[0]?.category?.name || "Uncategorized"
        }));
        setGames(mappedGames);
      } catch (err) {
        console.error("Failed to load games:", err);
      } finally {
        setLoading(false);
      }
    };

    const loadUser = async () => {
      try {
        const res = await fetchAPI('/auth/me');
        if (res.user) setUser(res.user);
      } catch (err) {}
    };
    
    loadGames();
    loadUser();
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-12 pb-10">
      
      {/* Welcome & Gamification Banner */}
      <section className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-transparent border border-border">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("welcome_back") || "Welcome back"}{user?.username ? `, ${user.username}` : ''} 🎮</h1>
          <p className="text-muted-foreground mt-1">
            {user ? (
              `${t("xp_away_1") || "You're"} ${(user.nextLevelXP || 1000) - (user.xp || 0)} ${t("xp_away_2") || "XP away from Level"} ${(user.level || 1) + 1}. ${t("keep_playing") || "Keep playing!"}`
            ) : (
              t("login_to_track") || "Log in to track your progress and level up!"
            )}
          </p>
        </div>
        {user && (
          <div className="w-full md:w-64 bg-surface/50 p-4 rounded-xl border border-border">
            <XPProgress level={user.level || 1} currentXP={user.xp || 0} nextLevelXP={user.nextLevelXP || 1000} />
          </div>
        )}
      </section>

      {/* Featured Game Hero */}
      {!loading && games.length > 0 && (
        <section className="relative rounded-3xl overflow-hidden aspect-[21/9] min-h-[300px] md:min-h-[400px] border border-border group cursor-pointer">
          <img 
            src={games[0].thumbnail || "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=1600&q=80"} 
            alt="Featured Game"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
          
          <div className="absolute bottom-0 left-0 p-6 md:p-12 max-w-2xl w-full">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 bg-error text-white text-xs font-bold uppercase rounded-full flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" /> {t("featured.badge") || "Editor's Choice"}
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">{games[0].title}</h2>
            <p className="text-zinc-300 text-sm md:text-base mb-6 line-clamp-2">
              {t("featured.desc") || "Dive into the neon-lit streets of the future. An action-packed cyberpunk platformer with stunning visuals and intense boss fights."}
            </p>
            <div className="flex gap-4">
              <Button size="lg" className="rounded-full shadow-lg shadow-primary/30">
                {t("featured.playNow") || "Play Now"}
              </Button>
              <Button size="lg" variant="glass" className="rounded-full">
                {t("featured.viewDetails") || "View Details"}
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Trending Games */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-warning" />
            <h2 className="text-2xl font-bold">{t("trending_now") || "Trending Now"}</h2>
          </div>
          <Link href="/games/trending">
            <Button variant="ghost" className="text-muted-foreground">
              {t("view_all") || "View All"} <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            <p className="text-muted-foreground col-span-full py-10 text-center">{t("loading") || "Loading..."}</p>
          ) : games.length > 0 ? (
            games.slice(0, 4).map(game => (
              <GameCard key={game.id} game={game} />
            ))
          ) : (
            <div className="col-span-full py-12 text-center border border-dashed border-border rounded-xl">
              <p className="text-muted-foreground font-semibold text-lg">{t("not_available") || "Chưa có"}</p>
              <p className="text-sm text-muted-foreground/70">{t("no_games_found") || "No games currently available in the database."}</p>
            </div>
          )}
        </div>
      </section>

      {/* New Releases */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Star className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">{t("new_releases") || "New Releases"}</h2>
          </div>
          <Link href="/games/new">
            <Button variant="ghost" className="text-muted-foreground">
              {t("view_all") || "View All"} <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            <p className="text-muted-foreground col-span-full py-10 text-center">{t("loading") || "Loading..."}</p>
          ) : games.length > 0 ? (
            [...games].reverse().slice(0, 4).map(game => (
              <GameCard key={`new-${game.id}`} game={game} />
            ))
          ) : (
             <div className="col-span-full py-12 text-center border border-dashed border-border rounded-xl">
              <p className="text-muted-foreground font-semibold text-lg">{t("not_available") || "Chưa có"}</p>
              <p className="text-sm text-muted-foreground/70">{t("no_games_found") || "No games currently available in the database."}</p>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
