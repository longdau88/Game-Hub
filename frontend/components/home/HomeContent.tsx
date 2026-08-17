"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Search, Heart, Zap, TrendingUp, ChevronRight, Loader2, Gamepad2 } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import { motion } from "framer-motion";
import { GameService } from "../../services/GameService";
import AdBanner from "../AdBanner";
import GameCard from "../ui/GameCard";
import HeroSection from "./HeroSection";

interface HomeContentProps {
  initialFeaturedGames: any[];
  initialMostPlayedGames: any[];
  initialMostLikedGames: any[];
  initialNewReleases: any[];
  initialAllGames: any[];
  categories: any[];
}

export default function HomeContent({
  initialFeaturedGames,
  initialMostPlayedGames,
  initialMostLikedGames,
  initialNewReleases,
  initialAllGames,
  categories,
}: HomeContentProps) {
  const { locale: language, t } = useLanguage();
  const { token, requireAuth } = useAuth();
  
  // Local state for interactivity and infinite scroll
  const [featuredGames, setFeaturedGames] = useState(initialFeaturedGames);
  const [mostPlayedGames, setMostPlayedGames] = useState(initialMostPlayedGames);
  const [mostLikedGames, setMostLikedGames] = useState(initialMostLikedGames);
  const [newReleases, setNewReleases] = useState(initialNewReleases);
  const [allGames, setAllGames] = useState(initialAllGames);
  
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [bookmarkedGames, setBookmarkedGames] = useState<Set<string>>(new Set());
  
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Infinite Scroll state
  const ROWS = 3;
  const COLS = 4;
  const PAGE_SIZE = ROWS * COLS;
  const [allGamesPage, setAllGamesPage] = useState(1);
  const [allGamesHasMore, setAllGamesHasMore] = useState(true);
  const [allGamesLoading, setAllGamesLoading] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Fetch client-only data (Auth dependent)
  useEffect(() => {
    const fetchAuthData = async () => {
      if (!token) return;
      try {
        const [recs, bookmarks] = await Promise.all([
          GameService.getRecommendations().catch(() => []),
          GameService.getBookmarks().catch(() => [])
        ]);
        if (Array.isArray(recs)) setRecommendations(recs);
        if (Array.isArray(bookmarks)) {
          setBookmarkedGames(new Set(bookmarks.map((b: any) => b.gameId || b.id)));
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchAuthData();
  }, [token]);

  // Handle Search & Filter with debounce
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      performSearch(search, selectedCategory);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const performSearch = async (searchQuery: string, catSlug: string) => {
    const isSearchingActive = !!searchQuery || !!catSlug;
    setIsSearching(isSearchingActive);
    
    if (isSearchingActive) {
      try {
        const data = await GameService.getPublishedGames({ search: searchQuery, category: catSlug, limit: 50 });
        if (Array.isArray(data)) setSearchResults(data);
      } catch (error) {
        console.error("Search failed", error);
      }
    }
    
    // Also reset infinite scroll for All Games if category changes
    if (!searchQuery) {
      setAllGamesPage(1);
      setAllGamesHasMore(true);
      fetchAllGamesPage(1, "", catSlug, true);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(search, selectedCategory);
    setTimeout(() => {
      document.getElementById('search-results')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleCategorySelect = (slug: string) => {
    const newCat = slug === selectedCategory ? "" : slug;
    setSelectedCategory(newCat);
    performSearch(search, newCat);
  };

  const fetchAllGamesPage = async (page: number, searchQuery: string, catSlug: string, reset = false) => {
    setAllGamesLoading(true);
    try {
      const data = await GameService.getPublishedGames({
        page,
        limit: PAGE_SIZE,
        search: searchQuery,
        category: catSlug
      });
      const list: any[] = Array.isArray(data) ? data : data.games || [];
      if (reset || page === 1) {
        setAllGames(list);
      } else {
        setAllGames(prev => {
          // Avoid duplicates
          const existingIds = new Set(prev.map(g => g.id));
          const newGames = list.filter(g => !existingIds.has(g.id));
          return [...prev, ...newGames];
        });
      }
      setAllGamesHasMore(list.length >= PAGE_SIZE);
      setAllGamesPage(page);
    } catch (error) {
      console.error("Failed to fetch all games page", error);
      setAllGamesHasMore(false);
    } finally {
      setAllGamesLoading(false);
    }
  };

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    if (isSearching) return; // Disable infinite scroll during active search

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && allGamesHasMore && !allGamesLoading) {
          fetchAllGamesPage(allGamesPage + 1, "", selectedCategory);
        }
      },
      { threshold: 0.1 }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [allGamesHasMore, allGamesLoading, allGamesPage, isSearching, selectedCategory]);

  const updateGameSaveCount = (gameId: string, delta: number) => {
    const updateFn = (prev: any[]) => prev.map(game => 
      game.id === gameId ? { ...game, saveCount: (game.saveCount || 0) + delta } : game
    );
    setFeaturedGames(updateFn);
    setMostPlayedGames(updateFn);
    setMostLikedGames(updateFn);
    setNewReleases(updateFn);
    setAllGames(updateFn);
    setSearchResults(updateFn);
    setRecommendations(updateFn);
  };

  const toggleBookmark = async (e: React.MouseEvent, gameId: string) => {
    e.preventDefault();
    if (!requireAuth()) return;

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

  return (
    <>
      {/* Sticky Header with Search and Categories */}
      <div className="sticky top-[80px] z-40 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-white/20 dark:border-zinc-800/50 shadow-lg shadow-blue-500/5 rounded-2xl p-4 sm:p-6 mb-6">
        <div className="w-full space-y-4">
          <form onSubmit={handleSearchSubmit} className="relative group w-full">
            <input
              type="text"
              placeholder={t("home.search") || "Search games..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 focus:border-blue-500/50 focus:bg-white dark:bg-zinc-900 rounded-2xl pl-12 pr-4 py-3 text-zinc-900 dark:text-white outline-none transition-all shadow-inner"
            />
            <Search className="w-5 h-5 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-blue-400 transition-colors" />
            <button type="submit" className="hidden">Search</button>
          </form>
          <div className="flex overflow-x-auto gap-2 pb-2 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full">
            <button
              onClick={() => handleCategorySelect("")}
              className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all duration-300 shrink-0 whitespace-nowrap ${
                selectedCategory === ""
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 border border-transparent'
                  : 'bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700'
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
                    : 'bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700'
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
        {isSearching || (search && selectedCategory) ? (
          <div id="search-results" className="pt-8 min-h-[50vh]">
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
            
            {searchResults.length === 0 ? (
              <div className="text-center py-32 border border-zinc-200/50 dark:border-zinc-800/50 border-dashed rounded-3xl bg-white/20 dark:bg-zinc-900/20 flex flex-col items-center">
                <Gamepad2 className="w-16 h-16 text-zinc-700 mb-4" />
                <h3 className="text-2xl font-medium text-zinc-600 dark:text-zinc-400 mb-2">No games found</h3>
                <p className="text-zinc-600">Try adjusting your search or filters.</p>
                <button onClick={() => {setSearch(''); setSelectedCategory(''); performSearch('', '');}} className="mt-6 px-6 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:bg-zinc-700 rounded-full text-sm font-medium transition-colors">
                  Clear Search
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {searchResults.map((game, idx) => (
                  <motion.div
                    key={`search-${game.id}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                  >
                    <GameCard 
                      game={game} 
                      isBookmarked={bookmarkedGames.has(game.id)} 
                      onToggleBookmark={toggleBookmark} 
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Normal Dashboard View */
          <div className="space-y-16">
            <HeroSection 
              featuredGames={featuredGames} 
              bookmarkedGames={bookmarkedGames} 
              onToggleBookmark={toggleBookmark} 
            />

            {/* Top Leaderboard Ad */}
            <div className="w-full flex justify-center">
              <AdBanner dataAdSlot="2970928598" className="min-w-[320px] max-w-[970px] min-h-[90px]" />
            </div>

            <div className="flex flex-col xl:flex-row gap-8 items-start">
              {/* Main Content Column */}
              <div className="flex-1 min-w-0 space-y-16">
                
                {recommendations.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-purple-500/20">
                          <Heart className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold">Vì bạn đã chơi...</h2>
                      </div>
                    </div>
                    <div className="flex gap-5 overflow-x-auto pb-4 hide-scrollbar snap-x snap-mandatory items-stretch">
                      {recommendations.slice(0, 10).map(game => (
                        <div key={`rec-${game.id}`} className="shrink-0 w-[240px] sm:w-[260px] snap-start flex flex-col">
                          <GameCard game={game} isBookmarked={bookmarkedGames.has(game.id)} onToggleBookmark={toggleBookmark} />
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {mostPlayedGames.length > 0 && (
                  <section>
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
                          <GameCard game={game} isBookmarked={bookmarkedGames.has(game.id)} onToggleBookmark={toggleBookmark} />
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {newReleases.length > 0 && (
                  <section>
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
                      {newReleases.slice(0, 10).map(game => (
                        <div key={`new-${game.id}`} className="shrink-0 w-[240px] sm:w-[260px] snap-start flex flex-col">
                          <GameCard game={game} isBookmarked={bookmarkedGames.has(game.id)} onToggleBookmark={toggleBookmark} />
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                <section>
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
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.4, delay: Math.min((idx % PAGE_SIZE) * 0.05, 0.4) }}
                        className="flex flex-col h-full"
                      >
                        <GameCard game={game} isBookmarked={bookmarkedGames.has(game.id)} onToggleBookmark={toggleBookmark} />
                      </motion.div>
                    ))}
                  </div>

                  {/* Infinite scroll sentinel */}
                  <div ref={loaderRef} className="mt-8 flex justify-center">
                    {allGamesLoading && (
                      <div className="flex items-center gap-3 text-zinc-500">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm">{t("home.loadingMore") || "Đang tải thêm game..."}</span>
                      </div>
                    )}
                    {!allGamesHasMore && allGames.length > 0 && (
                      <p className="text-zinc-400 text-sm">{t("home.allLoaded") || "Bạn đã xem hết tất cả game 🎮"}</p>
                    )}
                  </div>
                </section>
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
                      {mostLikedGames.slice(0, 5).map((game, idx) => (
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
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* SEO & Semantic FAQ Section */}
            <section className="pt-10 border-t border-zinc-200/50 dark:border-zinc-800/50">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">Game Hub - Nền tảng chơi game trực tuyến miễn phí tốt nhất</h2>
                <div className="space-y-6">
                  <article>
                    <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 mb-2">Game Hub là gì?</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      Game Hub là trang web chơi game miễn phí hàng đầu, nơi bạn có thể khám phá hàng nghìn tựa game hấp dẫn mà không cần tải về hay cài đặt. Từ những trò <strong>chơi game hành động 3D</strong> nghẹt thở, đến các tựa <strong>game giải đố miễn phí</strong> rèn luyện trí não, mọi thứ đều có sẵn để bạn trải nghiệm trực tiếp trên trình duyệt.
                    </p>
                  </article>
                  <article>
                    <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 mb-2">Chơi game trên Game Hub có mất phí không?</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      Hoàn toàn không! Mọi trò chơi web, game HTML5 tại Game Hub đều miễn phí 100%. Bạn có thể chơi trên máy tính, điện thoại hay máy tính bảng mọi lúc mọi nơi. Nền tảng của chúng tôi tối ưu tốc độ tải trang cực nhanh, đảm bảo bạn có trải nghiệm chơi game trực tuyến mượt mà nhất.
                    </p>
                  </article>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </>
  );
}
