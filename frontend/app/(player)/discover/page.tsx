"use client";

import { useState, useEffect } from "react";
import { GameCard, Game } from "@/components/shared/GameCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, Gamepad2 } from "lucide-react";
import { fetchAPI } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";


export default function DiscoverPage() {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [games, setGames] = useState<Game[]>([]);
  const [categories, setCategories] = useState<{name: string, active: boolean}[]>([{ name: "All", active: true }]);
  const [loading, setLoading] = useState(true);
  const { locale: language, t } = useLanguage();

  useEffect(() => {
    setMounted(true);
    const loadData = async () => {
      try {
        const [gamesData, catsData] = await Promise.all([
          fetchAPI('/games').catch(() => ({ data: [] })),
          fetchAPI('/categories').catch(() => ({ data: [] }))
        ]);
        const gamesArray = Array.isArray(gamesData) ? gamesData : (gamesData.data || []);
        const mappedGames = gamesArray.map((g: any) => ({
          id: g.id,
          title: g.title,
          creator: g.uploader?.username || "Unknown",
          rating: g.averageRating || 0,
          playCount: g.playCount || 0,
          thumbnail: g.coverImageUrl || "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&q=80",
          category: g.categories?.[0]?.name || "Uncategorized"
        }));
        setGames(mappedGames);

        const catsArray = Array.isArray(catsData) ? catsData : (catsData.data || []);
        const mappedCats = catsArray.map((c: any) => ({ name: c.nameTranslations?.[language] || c.name, active: false }));
        setCategories([{ name: t("category.all") || "All", active: true }, ...mappedCats]);
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [language, t]);

  // Debounced Search Effect
  useEffect(() => {
    if (!mounted) return;
    
    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const query = search ? `?search=${encodeURIComponent(search)}` : '';
        const gamesData = await fetchAPI(`/games${query}`).catch(() => ({ data: [] }));
        const gamesArray = Array.isArray(gamesData) ? gamesData : (gamesData.data || []);
        const mappedGames = gamesArray.map((g: any) => ({
          id: g.id,
          title: g.title,
          creator: g.uploader?.username || "Unknown",
          rating: g.averageRating || 0,
          playCount: g.playCount || 0,
          thumbnail: g.coverImageUrl || "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&q=80",
          category: g.categories?.[0]?.nameTranslations?.[language] || g.categories?.[0]?.name || "Uncategorized"
        }));
        setGames(mappedGames);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search, language]);

  if (!mounted) return null;

  return (
    <div className="space-y-10 pb-10">
      
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight">{t("discover_games") || "Discover Games"}</h1>
          <p className="text-muted-foreground mt-1">{t("discover_subtitle") || "Find your next favorite game from thousands of titles."}</p>
        </div>
        
        <div className="relative w-full md:w-96 flex gap-2 items-center">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              className="w-full pl-10 h-12 text-base rounded-2xl bg-surface border-border shadow-sm focus-visible:ring-primary/50"
              placeholder={t("search_placeholder") || "Search for games, creators, tags..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 hide-scrollbar flex-nowrap w-full">
        {categories.map(category => (
          <Button 
            key={category.name} 
            variant="outline" 
            className={`rounded-full shrink-0 ${category.active ? 'bg-primary text-primary-foreground border-primary' : 'bg-surface hover:bg-secondary'}`}
          >
            {category.name}
          </Button>
        ))}
      </div>

      {/* Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-primary" /> {t("all_games") || "All Games"}
          </h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {t("sort_by") || "Sort by:"} 
            <select className="bg-transparent font-medium text-foreground outline-none cursor-pointer">
              <option>{t("popular") || "Most Popular"}</option>
              <option>{t("newest") || "Newest"}</option>
              <option>{t("highest_rated") || "Highest Rated"}</option>
            </select>
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
            <div className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-2xl bg-surface/30">
              <Gamepad2 className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground font-semibold text-xl">{t("not_available") || "Chưa có"}</p>
              <p className="text-sm text-muted-foreground/70 mt-2">{t("no_games_found") || "No games currently available in the database."}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
