"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Play, Gamepad2, Search, Heart, Star, Zap, Flame, TrendingUp } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import Cookies from "js-cookie";
import { motion, AnimatePresence } from "framer-motion";

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

  useEffect(() => {
    fetchFeaturedGames();
    fetchGames();
    fetchMostPlayedGames();
    fetchCategories();
    fetchBookmarks();
  }, []);

  const fetchFeaturedGames = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/games/featured`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setFeaturedGames(data);
      }
    } catch (error) {
      console.error("Failed to fetch featured games", error);
    }
  };

  const fetchGames = async (searchQuery = search, catSlug = selectedCategory) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const params = new URLSearchParams();
      if (searchQuery) {
        params.append("search", searchQuery);
        setIsSearching(true);
      } else {
        setIsSearching(false);
      }
      if (catSlug) params.append("category", catSlug);
      
      const res = await fetch(`${apiUrl}/api/games?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setGames(data);
      }
    } catch (error) {
      console.error("Failed to fetch games", error);
    }
  };

  const fetchMostPlayedGames = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/games?sort=mostPlayed&limit=8`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setMostPlayedGames(data.slice(0, 8)); // Just to be safe
      }
    } catch (error) {
      console.error("Failed to fetch most played games", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/categories`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Failed to load categories", error);
    }
  };

  const fetchBookmarks = async () => {
    const token = Cookies.get("token");
    if (!token) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/games/user/bookmarked`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const bSet = new Set<string>();
        data.forEach((g: any) => bSet.add(g.id));
        setBookmarkedGames(bSet);
      }
    } catch (error) {
      console.error("Failed to fetch bookmarks", error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchGames(search, selectedCategory);
    setTimeout(() => {
      document.getElementById('search-results')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleCategorySelect = (slug: string) => {
    const newCat = slug === selectedCategory ? "" : slug;
    setSelectedCategory(newCat);
    fetchGames(search, newCat);
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
        } else {
          newBookmarks.delete(gameId);
        }
        setBookmarkedGames(newBookmarks);
      }
    } catch (error) {
      console.error("Failed to toggle bookmark", error);
    }
  };

  // Reusable Game Card Component
  const GameCard = ({ game }: { game: any }) => (
    <motion.div 
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group relative flex flex-col bg-zinc-900/40 backdrop-blur-sm border border-zinc-800/80 rounded-2xl overflow-hidden hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] transition-all duration-300"
    >
      <Link href={`/game/play?id=${game.id}`} className="aspect-[4/3] bg-zinc-950 relative overflow-hidden flex items-center justify-center block cursor-pointer">
        {game.coverImageUrl ? (
          <div className="w-full h-full relative">
            <img src={game.coverImageUrl} alt={game.title} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 ease-out" />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-80" />
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-700 ease-out">
            <Gamepad2 className="w-12 h-12 text-zinc-600" />
          </div>
        )}
        
        {/* Hover Play Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-[2px]">
          <div className="w-16 h-16 rounded-full bg-blue-600/90 flex items-center justify-center text-white shadow-[0_0_20px_rgba(37,99,235,0.6)] transform scale-75 group-hover:scale-100 transition-transform duration-300 spring">
            <Play className="w-8 h-8 fill-current ml-1" />
          </div>
        </div>

        {/* Floating Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {game.categories && game.categories.length > 0 && (
            <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border border-white/10">
              {game.categories[0].nameTranslations?.[language] || game.categories[0].name}
            </span>
          )}
        </div>

        {/* Bookmark Button */}
        <button 
          onClick={(e) => toggleBookmark(e, game.id)}
          className="absolute top-3 right-3 p-2 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/80 transition-colors group/btn z-10 border border-white/10"
        >
          <Heart className={`w-4 h-4 transition-colors ${bookmarkedGames.has(game.id) ? 'fill-pink-500 text-pink-500' : 'text-white group-hover/btn:text-pink-400'}`} />
        </button>
      </Link>
      
      <div className="p-5 flex-1 flex flex-col relative z-10 bg-gradient-to-b from-transparent to-zinc-900/90">
        <div className="flex justify-between items-start mb-2">
          <Link href={`/game/play?id=${game.id}`} className="flex-1">
            <h2 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">{game.title}</h2>
          </Link>
          <div className="flex items-center gap-1 text-yellow-500 text-xs font-bold bg-yellow-500/10 px-2 py-1 rounded-md ml-2 shrink-0">
            <Star className="w-3 h-3 fill-current" />
            {game.averageRating > 0 ? game.averageRating : "New"}
          </div>
        </div>
        <p className="text-xs text-zinc-400 mb-3 flex items-center gap-2">
          {game.uploader?.avatarUrl ? (
            <img src={game.uploader.avatarUrl} alt="avatar" className="w-5 h-5 rounded-full object-cover" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-blue-600/30 flex items-center justify-center text-[10px] text-blue-400">
              {game.uploader?.username?.[0]?.toUpperCase() || "A"}
            </div>
          )}
          <span className="font-medium text-zinc-300">{game.uploader?.username || "Admin"}</span>
        </p>
        <p className="text-zinc-500 text-sm mb-4 line-clamp-2 leading-relaxed">{game.descriptionTranslations?.[language] || game.description}</p>
        
        <div className="mt-auto flex items-center justify-between text-xs text-zinc-500 pt-3 border-t border-zinc-800/50">
          <span className="flex items-center gap-1.5"><Play className="w-3.5 h-3.5" /> {game.playCount || 0} plays</span>
          <span>{new Date(game.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-transparent text-zinc-100 selection:bg-blue-500/30">
      {/* Search Header Bar (Sticky) */}
      <div className="sticky top-0 z-40 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 py-4">
        <div className="container mx-auto px-4 flex gap-4 md:gap-8 items-center justify-between">
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl relative group">
            <input
              type="text"
              placeholder={t("home.search") || "Search games..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-blue-500/50 focus:bg-zinc-900 rounded-2xl pl-12 pr-4 py-3 text-white outline-none transition-all shadow-inner"
            />
            <Search className="w-5 h-5 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-blue-400 transition-colors" />
            <button type="submit" className="hidden">Search</button>
          </form>
          
          <div className="hidden md:flex gap-2 shrink-0">
            {categories.slice(0, 4).map(cat => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.slug)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  selectedCategory === cat.slug 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 border border-transparent' 
                    : 'bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                {cat.nameTranslations?.[language] || cat.name}
              </button>
            ))}
            {categories.length > 4 && (
              <button onClick={() => { document.getElementById('all-categories')?.scrollIntoView({ behavior: 'smooth' }) }} className="px-4 py-2 rounded-xl text-sm font-medium bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:text-white transition-all">
                More...
              </button>
            )}
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
              <div className="text-center py-32 border border-zinc-800/50 border-dashed rounded-3xl bg-zinc-900/20 flex flex-col items-center">
                <Gamepad2 className="w-16 h-16 text-zinc-700 mb-4" />
                <h3 className="text-2xl font-medium text-zinc-400 mb-2">No games found</h3>
                <p className="text-zinc-600">Try adjusting your search or filters.</p>
                <button onClick={() => {setSearch(''); setSelectedCategory(''); fetchGames('', '');}} className="mt-6 px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-full text-sm font-medium transition-colors">
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
                
                <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-center bg-zinc-900/30 border border-white/5 p-4 rounded-[2rem] backdrop-blur-md">
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
                        <h1 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight drop-shadow-lg">
                          {featuredGames[0].title}
                        </h1>
                        <p className="text-zinc-300 text-lg md:text-xl mb-8 line-clamp-2 md:line-clamp-3 font-medium drop-shadow-md">
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
                      <Link href={`/game/play?id=${game.id}`} key={`side-${game.id}`} className="group flex-1 flex items-center gap-4 bg-black/40 hover:bg-zinc-800/80 border border-white/5 hover:border-white/10 p-3 rounded-2xl transition-all duration-300">
                        <div className="w-24 h-24 md:w-32 md:h-full aspect-square md:aspect-auto rounded-xl overflow-hidden relative shrink-0">
                          <img src={game.coverImageUrl || '/placeholder.png'} alt={game.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div className="flex-1 py-2 pr-2">
                          <h3 className="font-bold text-white text-lg mb-1 group-hover:text-blue-400 transition-colors line-clamp-1">{game.title}</h3>
                          <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
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

            {/* Trending & Most Played Section */}
            {mostPlayedGames.length > 0 && (
              <section className="mb-20">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg shadow-orange-500/20">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold">Trending Now</h2>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {mostPlayedGames.map(game => <GameCard key={`most-played-${game.id}`} game={game} />)}
                </div>
              </section>
            )}

            {/* New Releases Section */}
            <section className="mb-20">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-purple-500/20">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold">New Releases</h2>
                </div>
                
                {/* Secondary Category Filter */}
                <div id="all-categories" className="hidden lg:flex items-center gap-2 bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-800">
                  <button onClick={() => handleCategorySelect("")} className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-colors ${selectedCategory === "" ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}>All</button>
                  {categories.slice(0, 5).map(cat => (
                    <button
                      key={`sec-${cat.id}`}
                      onClick={() => handleCategorySelect(cat.slug)}
                      className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-colors ${selectedCategory === cat.slug ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
                    >
                      {cat.nameTranslations?.[language] || cat.name}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {games.slice(0, 12).map(game => <GameCard key={`new-${game.id}`} game={game} />)}
              </div>
              
              {games.length > 12 && (
                <div className="mt-12 flex justify-center">
                  <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="px-8 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-full font-medium transition-all text-zinc-300 hover:text-white">
                    Load More Games
                  </button>
                </div>
              )}
            </section>
            
          </motion.div>
        )}
      </div>
    </div>
  );
}
