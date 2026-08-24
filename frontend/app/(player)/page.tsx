"use client";

import { useState, useEffect } from "react";
import { GameCard, Game } from "@/components/shared/GameCard";
import { XPProgress } from "@/components/shared/XPProgress";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Search, Flame, Trophy, Star, ChevronRight } from "lucide-react";

import { fetchAPI } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import useSWR from "swr";
import { useAuth } from "@/contexts/AuthContext";

export default function PlayerHome() {
  const [mounted, setMounted] = useState(false);
  const { t } = useLanguage();
  
  // Use AuthContext for user instead of refetching /auth/me manually
  const { profile: user } = useAuth();

  // SWR handles caching and fast loading
  const { data: gamesData = [], isLoading } = useSWR('/games');
  
  // Adapt backend data
  const mappedGames: Game[] = (Array.isArray(gamesData) ? gamesData : (gamesData.data || [])).map((g: any) => ({
    id: g.id,
    title: g.title,
    creator: g.uploader?.username || "Unknown",
    rating: g.averageRating || 0,
    playCount: g.playCount || 0,
    thumbnail: g.coverImageUrl || "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&q=80",
    category: g.categories?.[0]?.name || "Uncategorized"
  }));

  useEffect(() => {
    setMounted(true);
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
              (() => {
                const level = user.level || 1;
                const xp = user.xp || 0;
                const nextLevelXP = Math.pow(level, 2) * 100;
                return `${t("xp_away_1") || "You're"} ${nextLevelXP - xp} ${t("xp_away_2") || "XP away from Level"} ${level + 1}. ${t("keep_playing") || "Keep playing!"}`;
              })()
            ) : (
              t("login_to_track") || "Log in to track your progress and level up!"
            )}
          </p>
        </div>
        {user && (
          <div className="w-full md:w-64 bg-surface/50 p-4 rounded-xl border border-border">
            <XPProgress level={user.level || 1} currentXP={user.xp || 0} nextLevelXP={Math.pow(user.level || 1, 2) * 100} />
          </div>
        )}
      </section>

      {/* Featured Game Hero */}
      {!isLoading && mappedGames.length > 0 && (
        <section className="relative rounded-3xl overflow-hidden w-full h-[350px] sm:h-[400px] lg:h-auto lg:aspect-[21/9] border border-border group cursor-pointer">
          <img 
            src={mappedGames[0].thumbnail || "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=1600&q=80"} 
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
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3 md:mb-4 line-clamp-2">{mappedGames[0].title}</h2>
            <p className="text-zinc-300 text-sm md:text-base mb-5 md:mb-6 line-clamp-2 sm:line-clamp-3">
              {t("featured.desc") || "Experience the most thrilling adventure of the year. Jump in and show your skills in this community favorite!"}
            </p>
            <div className="flex items-center gap-4">
              <Link href={`/game/play?id=${mappedGames[0].id}`}>
                <Button size="lg" className="rounded-xl px-8 font-bold bg-white text-zinc-950 hover:bg-zinc-200">
                  {t("featured.play") || "Play Now"}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {isLoading && (
        <div className="h-[300px] rounded-3xl bg-secondary/50 animate-pulse" />
      )}

      {/* Popular Games Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-500" /> 
            {t("popular.title") || "Popular Right Now"}
          </h2>
          <Link href="/discover">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              {t("popular.viewAll") || "View all"} <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-[4/3] rounded-2xl bg-secondary/50 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {mappedGames.slice(0, 8).map(game => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
