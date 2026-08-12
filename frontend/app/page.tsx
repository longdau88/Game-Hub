"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Play, Gamepad2, Search, Heart, Star, Zap, Flame, TrendingUp, ChevronRight, Loader2 } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import Cookies from "js-cookie";
import { motion, AnimatePresence } from "framer-motion";
import { GameService } from "../services/GameService";
import { CategoryService } from "../services/CategoryService";

export default function Home() {
  const { locale: language, t } = useLanguage();
  const [games, setGames] = useState<any[]>([]);
  const [mostPlayedGames, setMostPlayedGames] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [featuredGames, setFeaturedGames] = useState<any[]>([]);
  const [bookmarkedGames, setBookmarkedGames] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);

  const [mostLikedGames, setMostLikedGames] = useState<any[]>([]);

  // All Games (infinite scroll)
  const ROWS = 3;
  const COLS = 4;
  const PAGE_SIZE = ROWS * COLS; // 12 per page
  const [allGames, setAllGames] = useState<any[]>([]);
  const [allGamesPage, setAllGamesPage] = useState(1);
  const [allGamesHasMore, setAllGamesHasMore] = useState(true);
  const [allGamesLoading, setAllGamesLoading] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchFeaturedGames();
    fetchGames();
    fetchMostPlayedGames();
    fetchMostLikedGames();
    fetchCategories();
    fetchBookmarks();
    fetchAllGamesPage(1, "", "");

    const handleFocus = () => {
      fetchMostPlayedGames();
      fetchMostLikedGames();
      fetchFeaturedGames();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        handleFocus();
      }
    });

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, []);

  const fetchFeaturedGames = async () => {
    try {
      const data = await GameService.getFeaturedGames();
      if (Array.isArray(data)) setFeaturedGames(data);
    } catch (error) {
      console.error("Failed to fetch featured games", error);
    }
  };

  const fetchGames = async (searchQuery = search, catSlug = selectedCategory) => {
    try {
      setIsSearching(!!searchQuery);
      const data = await GameService.getPublishedGames({ search: searchQuery, category: catSlug });
      if (Array.isArray(data)) setGames(data);
    } catch (error) {
      console.error("Failed to fetch games", error);
    }
  };

  const fetchMostPlayedGames = async () => {
    try {
      const data = await GameService.getMostPlayedGames();
      if (Array.isArray(data)) setMostPlayedGames(data);
    } catch (error) {
      console.error("Failed to fetch most played games", error);
    }
  };

  const fetchMostLikedGames = async () => {
    try {
      const data = await GameService.getMostLikedGames();
      if (Array.isArray(data)) setMostLikedGames(data);
    } catch (error) {
      console.error("Failed to fetch most liked games", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await CategoryService.getAllCategories();
      setCategories(data);
    } catch (error) {
      console.error("Failed to load categories", error);
    }
  };

  const fetchBookmarks = async () => {
    const token = Cookies.get("token");
    if (!token) return;
    try {
      const data = await GameService.getBookmarks();
      if (Array.isArray(data)) {
        setBookmarkedGames(new Set(data.map((b: any) => b.gameId || b.id))); // Adjust based on actual API response
      }
    } catch (error) {
      console.error("Failed to load bookmarks", error);
    }
  };

  const fetchAllGamesPage = async (page: number, searchQuery: string, catSlug: string) => {
    setAllGamesLoading(true);
    try {
      const data = await GameService.getPublishedGames({
        page,
        limit: PAGE_SIZE,
        search: searchQuery,
        category: catSlug
      });
      const list: any[] = Array.isArray(data) ? data : data.games || [];
      if (page === 1) {
        setAllGames(list);
      } else {
        setAllGames(prev => [...prev, ...list]);
      }
      setAllGamesHasMore(list.length >= PAGE_SIZE);
      setAllGamesPage(page);
    } catch (error) {
      console.error("Failed to fetch all games", error);
      setAllGamesHasMore(false); // Prevent infinite retry loop on 503/errors
    } finally {
      setAllGamesLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchGames(search, selectedCategory);
    setAllGames([]);
    setAllGamesPage(1);
    setAllGamesHasMore(true);
    fetchAllGamesPage(1, search, selectedCategory);
    setTimeout(() => {
      document.getElementById('search-results')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleCategorySelect = (slug: string) => {
    const newCat = slug === selectedCategory ? "" : slug;
    setSelectedCategory(newCat);
    fetchGames(search, newCat);
    setAllGames([]);
    setAllGamesPage(1);
    setAllGamesHasMore(true);
    fetchAllGamesPage(1, search, newCat);
  };

  const updateGameSaveCount = (gameId: string, delta: number) => {
    const updateFn = (prev: any[]) => prev.map(game => 
      game.id === gameId ? { ...game, saveCount: (game.saveCount || 0) + delta } : game
    );
    setGames(updateFn);
    setMostPlayedGames(updateFn);
    setMostLikedGames(updateFn);
    setAllGames(updateFn);
    setFeaturedGames(updateFn);
  };

  const toggleBookmark = async (e: React.MouseEvent, gameId: string) => {
    e.preventDefault();
    const token = Cookies.get("token");
    if (!token) {
      alert("Vui lòng đăng nhập để lưu game!"); // Use translation if available
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/games/${gameId}/bookmark`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        const newBookmarks = new Set(bookmarkedGames);
        if (data.bookmarked) {
          newBookmarks.add(gameId);
          updateGameSaveCount(gameId, 1);
        } else {
          newBookmarks.delete(gameId);
          updateGameSaveCount(gameId, -1);
        }
        setBookmarkedGames(newBookmarks);
      }
    } catch (error) {
      console.error("Failed to toggle bookmark", error);
    }
  };

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && allGamesHasMore && !allGamesLoading) {
          fetchAllGamesPage(allGamesPage + 1, search, selectedCategory);
        }
      },
      { threshold: 0.1 }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [allGamesHasMore, allGamesLoading, allGamesPage, search, selectedCategory]);

  // Reusable Game Card Component
  const GameCard = ({ game }: { game: any }) => (
    <motion.div 
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group relative flex flex-col h-full bg-white/40 dark:bg-zinc-900/40 backdrop-blur-sm border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl overflow-hidden hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] transition-all duration-300"
    >
      <Link href={`/game/play?id=${game.id}`} className="aspect-[4/3] bg-zinc-100 dark:bg-zinc-950 relative overflow-hidden flex items-center justify-center block cursor-pointer">
        {game.coverImageUrl ? (
          <div className="w-full h-full relative">
            <img src={game.coverImageUrl} alt={game.title} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 ease-out" />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-200 dark:from-zinc-900 via-transparent to-transparent opacity-80" />
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-200 dark:from-zinc-800/50 to-zinc-300 dark:to-zinc-900/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-700 ease-out">
            <Gamepad2 className="w-12 h-12 text-zinc-600" />
          </div>
        )}
        
        {/* Hover Play Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-[2px]">
          <div className="w-16 h-16 rounded-full bg-blue-600/90 flex items-center justify-center text-zinc-900 dark:text-white shadow-[0_0_20px_rgba(37,99,235,0.6)] transform scale-75 group-hover:scale-100 transition-transform duration-300 spring">
            <Play className="w-8 h-8 fill-current ml-1" />
          </div>
        </div>

        {/* Floating Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {game.categories && game.categories.length > 0 && (
            <span className="bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border border-white/20">
              {game.categories[0].nameTranslations?.[language] || game.categories[0].name}
            </span>
          )}
        </div>

        {/* Bookmark Button */}
        <button 
          onClick={(e) => toggleBookmark(e, game.id)}
          className="absolute top-3 right-3 p-2 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/80 transition-colors group/btn z-10 border border-black/10 dark:border-white/10"
        >
          <Heart className={`w-4 h-4 transition-colors ${bookmarkedGames.has(game.id) ? 'fill-pink-500 text-pink-500' : 'text-white group-hover/btn:text-pink-400'}`} />
        </button>
      </Link>
      
      <div className="p-5 flex-1 flex flex-col relative z-10 bg-gradient-to-b from-transparent to-white/90 dark:to-zinc-900/90">
        <div className="flex justify-between items-start mb-2">
          <Link href={`/game/play?id=${game.id}`} className="flex-1">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white group-hover:text-blue-400 transition-colors line-clamp-1">{game.title}</h2>
          </Link>
          <div className="flex items-center gap-1 text-yellow-500 text-xs font-bold bg-yellow-500/10 px-2 py-1 rounded-md ml-2 shrink-0">
            <Star className="w-3 h-3 fill-current" />
            {game.averageRating > 0 ? game.averageRating : "New"}
          </div>
        </div>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3 flex items-center gap-2">
          {game.uploader?.avatarUrl ? (
            <img src={game.uploader.avatarUrl} alt="avatar" className="w-5 h-5 rounded-full object-cover" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-blue-600/30 flex items-center justify-center text-[10px] text-blue-400">
              {game.uploader?.username?.[0]?.toUpperCase() || "A"}
            </div>
          )}
          <span className="font-medium text-zinc-700 dark:text-zinc-300">{game.uploader?.username || "Admin"}</span>
        </p>
        <p className="text-zinc-500 text-sm mb-4 line-clamp-2 leading-relaxed">{game.descriptionTranslations?.[language] || game.description}</p>
        
        <div className="mt-auto flex items-center justify-between text-xs text-zinc-500 pt-3 border-t border-zinc-200/50 dark:border-zinc-800/50">
          <span className="flex items-center gap-1.5"><Play className="w-3.5 h-3.5" /> {game.playCount || 0} {t("game.plays") ? t("game.plays").toLowerCase() : "plays"}</span>
          <span>{new Date(game.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-transparent text-zinc-900 dark:text-zinc-100 selection:bg-blue-500/30">
      {/* Search Header Bar (Sticky) */}
      <div className="sticky top-16 z-40 bg-white dark:bg-[#050505] backdrop-blur-xl shadow-[0_1px_0_0_rgba(0,0,0,0.08)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.06)] py-3">
        <div className="container mx-auto px-4 space-y-2">
          {/* Row 1: Search bar */}
          <form onSubmit={handleSearch} className="relative group max-w-2xl w-full">
            <input
              type="text"
              placeholder={t("home.search") || "Search games..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 focus:border-blue-500/50 focus:bg-white dark:bg-zinc-900 rounded-2xl pl-12 pr-4 py-3 text-zinc-900 dark:text-white outline-none transition-all shadow-inner"
            />
            <Search className="w-5 h-5 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-blue-400 transition-colors" />
            <button type="submit" className="hidden">Search</button>
          </form>
          {/* Row 2: Category filter - all categories */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleCategorySelect("")}
              className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all duration-300 shrink-0 whitespace-nowrap ${
                selectedCategory === ""
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 border border-transparent'
                  : 'bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800'
              }`}
            >
              {t("home.filterAll")}
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.slug)}
                className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all duration-300 shrink-0 whitespace-nowrap ${
                  selectedCategory === cat.slug
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 border border-transparent'
                    : 'bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800'
                }`}
              >
                {cat.nameTranslations?.[language] || cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        
        {/* Dynamic State: If Searching, show search results only */}
        {isSearching || selectedCategory ? (
          <div id="search-results" className="pt-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <Search className="w-6 h-6 text-blue-400" />
              </div>
              <h2 className="text-3xl font-bold">
                {search ? `Results for "${search}"` : ''} 
                {search && selectedCategory ? ' in ' : ''}
                {selectedCategory ? (categories.find(c => c.slug === selectedCategory)?.nameTranslations?.[language] || selectedCategory) : ''}
              </h2>
            </div>
            
            {games.length === 0 ? (
              <div className="text-center py-32 border border-zinc-200/50 dark:border-zinc-800/50 border-dashed rounded-3xl bg-white/20 dark:bg-zinc-900/20 flex flex-col items-center">
                <Gamepad2 className="w-16 h-16 text-zinc-700 mb-4" />
                <h3 className="text-2xl font-medium text-zinc-600 dark:text-zinc-400 mb-2">No games found</h3>
                <p className="text-zinc-600">Try adjusting your search or filters.</p>
                <button onClick={() => {setSearch(''); setSelectedCategory(''); fetchGames('', '');}} className="mt-6 px-6 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:bg-zinc-700 rounded-full text-sm font-medium transition-colors">
                  Clear Search
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {games.map(game => <GameCard key={game.id} game={game} />)}
              </div>
            )}
          </div>
        ) : (
          /* Normal Dashboard View */
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Hero Section - Featured Games Carousel */}
            {featuredGames.length > 0 && (
              <section className="mb-20 relative">
                {/* Background glow effects */}
                <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[400px] h-[400px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />
                
                <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-center bg-white/30 dark:bg-zinc-900/30 border border-black/5 dark:border-white/5 p-4 rounded-[2rem] backdrop-blur-md">
                  {/* Main Featured Game */}
                  <div className="w-full lg:w-2/3">
                    <Link href={`/game/play?id=${featuredGames[0].id}`} className="group relative block rounded-3xl overflow-hidden aspect-video shadow-2xl">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10" />
                      <img 
                        src={featuredGames[0].coverImageUrl || '/placeholder.png'} 
                        alt={featuredGames[0].title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
                      />
                      
                      <div className="absolute bottom-0 left-0 p-8 md:p-12 z-20 w-full max-w-3xl">
                        <div className="flex gap-2 mb-4">
                          <span className="px-3 py-1 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-lg flex items-center gap-1.5">
                            <Flame className="w-3.5 h-3.5" /> Featured
                          </span>
                          {featuredGames[0].categories?.[0] && (
                            <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-white border border-white/20">
                              {featuredGames[0].categories[0].nameTranslations?.[language] || featuredGames[0].categories[0].name}
                            </span>
                          )}
                        </div>
                        <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white mb-4 leading-tight drop-shadow-lg">
                          {featuredGames[0].title}
                        </h1>
                        <p className="text-zinc-200 text-lg md:text-xl mb-8 line-clamp-2 md:line-clamp-3 font-medium drop-shadow-md">
                          {featuredGames[0].descriptionTranslations?.[language] || featuredGames[0].description}
                        </p>
                        
                        <div className="flex gap-4">
                          <button className="px-8 py-4 bg-white text-black hover:bg-zinc-200 rounded-2xl font-bold text-lg flex items-center gap-3 transition-transform hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                            <Play className="w-6 h-6 fill-current" /> Play Now
                          </button>
                        </div>
                      </div>
                    </Link>
                  </div>
                  
                  {/* Sidebar Featured Games */}
                  <div className="w-full lg:w-1/3 flex flex-col gap-4 h-full">
                    {featuredGames.slice(1, 4).map((game, idx) => (
                      <Link href={`/game/play?id=${game.id}`} key={`side-${game.id}`} className="group flex-1 flex items-center gap-4 bg-white/80 dark:bg-black/40 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 border border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10 p-3 rounded-2xl transition-all duration-300">
                        <div className="w-24 h-24 md:w-32 md:h-full aspect-square md:aspect-auto rounded-xl overflow-hidden relative shrink-0">
                          <img src={game.coverImageUrl || '/placeholder.png'} alt={game.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div className="flex-1 py-2 pr-2">
                          <h3 className="font-bold text-zinc-900 dark:text-white text-lg mb-1 group-hover:text-blue-400 transition-colors line-clamp-1">{game.title}</h3>
                          <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 mb-2">
                            <span className="text-yellow-500 flex items-center"><Star className="w-3 h-3 fill-current mr-1" /> {game.averageRating}</span>
                            <span>•</span>
                            <span>{game.categories?.[0]?.nameTranslations?.[language] || game.categories?.[0]?.name || 'Game'}</span>
                          </div>
                          <p className="text-xs text-zinc-500 line-clamp-2">{game.descriptionTranslations?.[language] || game.description}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Layout for Trending, New Releases and Sidebar */}
            <div className="flex flex-col xl:flex-row gap-8 items-start">
              {/* Main Content Column */}
              <div className="flex-1 min-w-0">
                {/* Trending & Most Played Section */}
                {mostPlayedGames.length > 0 && (
                  <section className="mb-16">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg shadow-orange-500/20">
                          <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold">{t("home.trendingNow")}</h2>
                      </div>
                      <Link href="/games/trending" className="flex items-center gap-1.5 text-sm font-medium text-blue-500 hover:text-blue-400 transition-colors group">
                        {t("home.seeMore") || "Xem thêm"}
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                    <div className="flex gap-5 overflow-x-auto pb-4 hide-scrollbar snap-x snap-mandatory items-stretch">
                      {mostPlayedGames.slice(0, 10).map(game => (
                        <div key={`most-played-${game.id}`} className="shrink-0 w-[240px] sm:w-[260px] snap-start flex flex-col">
                          <GameCard game={game} />
                        </div>
                      ))}
                      {mostPlayedGames.length >= 10 && (
                        <div className="shrink-0 w-[200px] flex items-center justify-center snap-start">
                          <Link href="/games/trending" className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-orange-400 dark:hover:border-orange-500 text-zinc-500 hover:text-orange-500 transition-all group w-full h-full min-h-[200px]">
                            <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                              <ChevronRight className="w-6 h-6" />
                            </div>
                            <span className="text-sm font-medium text-center">{t("home.seeMore") || "Xem tất cả"}</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                <section className="mb-16">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-purple-500/20">
                        <Zap className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold">{t("home.newReleases")}</h2>
                    </div>
                    <Link href="/games/new" className="flex items-center gap-1.5 text-sm font-medium text-blue-500 hover:text-blue-400 transition-colors group shrink-0 ml-4">
                      {t("home.seeMore") || "Xem thêm"}
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>

                  <div className="flex gap-5 overflow-x-auto pb-4 hide-scrollbar snap-x snap-mandatory items-stretch">
                    {games.slice(0, 10).map(game => (
                      <div key={`new-${game.id}`} className="shrink-0 w-[240px] sm:w-[260px] snap-start flex flex-col">
                        <GameCard game={game} />
                      </div>
                    ))}
                    {games.length >= 10 && (
                      <div className="shrink-0 w-[200px] flex items-center justify-center snap-start">
                        <Link href="/games/new" className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-purple-400 dark:hover:border-purple-500 text-zinc-500 hover:text-purple-500 transition-all group w-full h-full min-h-[200px]">
                          <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                            <ChevronRight className="w-6 h-6" />
                          </div>
                          <span className="text-sm font-medium text-center">{t("home.seeMore") || "Xem tất cả"}</span>
                        </Link>
                      </div>
                    )}
                  </div>
                </section>

                {/* All Games Section - Infinite Scroll Grid */}
                {!isSearching && !selectedCategory && (
                  <section className="mb-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2.5 bg-gradient-to-br from-zinc-500 to-zinc-700 rounded-xl shadow-lg">
                        <Gamepad2 className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold">{t("home.allGames") || "Tất Cả Game"}</h2>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                      {allGames.map((game, idx) => (
                        <motion.div
                          key={`all-${game.id}-${idx}`}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25, delay: Math.min((idx % PAGE_SIZE) * 0.04, 0.4) }}
                          className="flex flex-col"
                        >
                          <GameCard game={game} />
                        </motion.div>
                      ))}
                    </div>

                    {/* Infinite scroll sentinel */}
                    <div ref={loaderRef} className="mt-8 flex justify-center">
                      {allGamesLoading && (
                        <div className="flex items-center gap-3 text-zinc-500">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span className="text-sm">Đang tải thêm game...</span>
                        </div>
                      )}
                      {!allGamesHasMore && allGames.length > 0 && (
                        <p className="text-zinc-400 text-sm">Bạn đã xem hết tất cả game 🎮</p>
                      )}
                    </div>
                  </section>
                )}
              </div>

              {/* Sidebar Column: Top Liked Games */}
              <div className="w-full xl:w-[320px] shrink-0 self-start sticky top-[148px]">
                {mostLikedGames.length > 0 && (
                  <div className="bg-white dark:bg-zinc-900/40 shadow-xl shadow-zinc-200/50 dark:shadow-none border border-black/5 dark:border-white/5 rounded-2xl p-6 backdrop-blur-md">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-pink-500/10 rounded-lg">
                        <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
                      </div>
                      <h2 className="text-xl font-bold">{t("home.topLiked") || "Top Yêu Thích"}</h2>
                    </div>
                    <div className="flex flex-col gap-4">
                      {mostLikedGames.map((game, idx) => (
                        <Link href={`/game/play?id=${game.id}`} key={`liked-${game.id}`} className="flex items-center gap-4 group p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors -mx-2">
                          <div className={`w-6 text-center text-lg font-black transition-colors ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-zinc-700 dark:text-zinc-300' : idx === 2 ? 'text-amber-600' : 'text-zinc-700 group-hover:text-pink-500'}`}>
                            {idx + 1}
                          </div>
                          <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-black/5 dark:border-white/5 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center relative">
                            {game.coverImageUrl ? (
                              <img src={game.coverImageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                              <Gamepad2 className="w-8 h-8 text-zinc-400 dark:text-zinc-600 group-hover:scale-110 transition-transform duration-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200 truncate group-hover:text-pink-400 transition-colors">{game.title}</h3>
                            <div className="flex items-center gap-3 mt-1.5 text-xs">
                              <span className="flex items-center gap-1 text-pink-500 font-medium">
                                <Heart className="w-3 h-3 fill-pink-500" /> {game.saveCount || 0}
                              </span>
                              <span className="text-zinc-600 flex items-center gap-1">
                                <Play className="w-3 h-3" /> {game.playCount || 0}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
          </motion.div>
        )}
      </div>
    </div>
  );
}
