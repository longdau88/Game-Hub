"use client";

import { useState, useEffect } from "react";
import { GameCard, Game } from "@/components/shared/GameCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, Gamepad2, ChevronDown, Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import useSWR from "swr";

export default function DiscoverPage() {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState("mostPlayed");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const { locale: language, t } = useLanguage();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Click outside to close sort dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.sort-dropdown')) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch games with SWR
  const queryParams = new URLSearchParams();
  if (debouncedSearch) queryParams.append('search', debouncedSearch);
  queryParams.append('sort', sort);

  const { data: gamesData = [], isLoading: gamesLoading } = useSWR(`/games?${queryParams.toString()}`);
  const { data: catsData = [], isLoading: catsLoading } = useSWR('/categories');

  // Adapt data
  const gamesArray = Array.isArray(gamesData) ? gamesData : (gamesData.data || []);
  const mappedGames: Game[] = gamesArray.map((g: any) => ({
    id: g.id,
    title: g.title,
    creator: g.uploader?.username || "Unknown",
    rating: g.averageRating || 0,
    playCount: g.playCount || 0,
    thumbnail: g.coverImageUrl || "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&q=80",
    category: g.categories?.[0]?.nameTranslations?.[language] || g.categories?.[0]?.name || "Uncategorized"
  }));

  const catsArray = Array.isArray(catsData) ? catsData : (catsData.data || []);
  const mappedCats = catsArray.map((c: any) => ({ 
    name: c.nameTranslations?.[language] || c.name, 
    active: false 
  }));
  const categories = [{ name: t("category.all") || "All", active: true }, ...mappedCats];

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
      <div className="relative w-full">
        <div className="flex items-center gap-2 overflow-x-auto pb-4 hide-scrollbar flex-nowrap w-full pr-8">
          {catsLoading ? (
            <div className="flex gap-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-24 h-10 rounded-full bg-secondary/50 animate-pulse shrink-0" />
              ))}
            </div>
          ) : (
            categories.map(category => (
              <Button 
                key={category.name} 
                variant="outline" 
                className={`rounded-full shrink-0 transition-colors ${category.active ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90' : 'bg-surface hover:bg-secondary'}`}
              >
                {category.name}
              </Button>
            ))
          )}
        </div>
        {/* Gradient fade on the right to indicate scrolling */}
        <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none" />
      </div>

      {/* Grid */}
      <div>
        <div className="flex items-center justify-between mb-6 relative z-10">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-primary" /> {t("all_games") || "All Games"}
          </h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground relative sort-dropdown">
            {t("sort.title") || "Sort by:"} 
            
            <button 
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="flex items-center gap-1.5 font-medium text-foreground outline-none cursor-pointer hover:text-primary transition-colors bg-surface border border-border px-3 py-1.5 rounded-lg"
            >
              {sort === 'mostPlayed' ? (t("sort.popular") || "Most Popular") : 
               sort === 'mostLiked' ? (t("sort.most_saved") || "Most Saved") : 
               (t("sort.newest") || "Newest")}
              <ChevronDown className="w-4 h-4 opacity-50" />
            </button>

            {isSortOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-surface border border-border rounded-xl shadow-xl overflow-hidden py-1 z-50">
                <button 
                  onClick={() => { setSort('mostPlayed'); setIsSortOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-secondary flex items-center justify-between transition-colors"
                >
                  <span className={sort === 'mostPlayed' ? 'text-primary font-medium' : 'text-foreground'}>
                    {t("sort.popular") || "Most Popular"}
                  </span>
                  {sort === 'mostPlayed' && <Check className="w-4 h-4 text-primary" />}
                </button>
                <button 
                  onClick={() => { setSort('mostLiked'); setIsSortOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-secondary flex items-center justify-between transition-colors"
                >
                  <span className={sort === 'mostLiked' ? 'text-primary font-medium' : 'text-foreground'}>
                    {t("sort.most_saved") || "Most Saved"}
                  </span>
                  {sort === 'mostLiked' && <Check className="w-4 h-4 text-primary" />}
                </button>
                <button 
                  onClick={() => { setSort('newest'); setIsSortOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-secondary flex items-center justify-between transition-colors"
                >
                  <span className={sort === 'newest' ? 'text-primary font-medium' : 'text-foreground'}>
                    {t("sort.newest") || "Newest"}
                  </span>
                  {sort === 'newest' && <Check className="w-4 h-4 text-primary" />}
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {gamesLoading ? (
            [...Array(8)].map((_, i) => (
              <div key={i} className="aspect-[4/3] rounded-2xl bg-secondary/50 animate-pulse" />
            ))
          ) : mappedGames.length > 0 ? (
            mappedGames.map(game => (
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
