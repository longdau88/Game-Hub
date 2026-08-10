"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Play, Gamepad2, Search, Heart, Filter } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import Cookies from "js-cookie";

export default function Home() {
  const { t } = useLanguage();
  const [games, setGames] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [bookmarkedGames, setBookmarkedGames] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchGames();
    fetchCategories();
    fetchBookmarks();
  }, []);

  const fetchGames = async (searchQuery = search, catSlug = selectedCategory) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
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
  };

  const handleCategorySelect = (slug: string) => {
    const newCat = slug === selectedCategory ? "" : slug;
    setSelectedCategory(newCat);
    fetchGames(search, newCat);
  };

  const toggleBookmark = async (e: React.MouseEvent, gameId: string) => {
    e.preventDefault(); // Prevent navigating to game
    const token = Cookies.get("token");
    if (!token) {
      alert("Please login to bookmark games");
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

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <section className="mb-16 rounded-2xl bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-zinc-800/60 p-8 md:p-12 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400">
            {t("home.heroTitle")}
          </h1>
          <p className="text-lg text-zinc-300 mb-8">
            {t("home.heroDesc")}
          </p>
          <div className="flex gap-4">
            <button 
              onClick={() => document.getElementById('store-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors shadow-[0_0_20px_rgba(37,99,235,0.3)]"
            >
              {t("home.browseStore")}
            </button>
          </div>
        </div>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-40 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"></div>
      </section>

      {/* Featured Games Grid */}
      <section id="store-section">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600/20 rounded-xl">
              <Gamepad2 className="w-8 h-8 text-blue-500" />
            </div>
            <h1 className="text-3xl font-bold">{t("home.title")}</h1>
          </div>

          <form onSubmit={handleSearch} className="flex-1 max-w-md relative">
            <input
              type="text"
              placeholder={t("home.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-blue-500 rounded-xl pl-12 pr-4 py-3 text-white outline-none"
            />
            <Search className="w-5 h-5 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <button type="submit" className="hidden">Search</button>
          </form>
        </div>

        {/* Categories Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button 
            onClick={() => handleCategorySelect("")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${selectedCategory === "" ? 'bg-blue-600 text-white border-blue-500' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'}`}
          >
            {t("home.allGames")}
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat.slug)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${selectedCategory === cat.slug ? 'bg-blue-600 text-white border-blue-500' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
        
        {games.length === 0 ? (
          <div className="text-center py-20 border border-zinc-800/50 border-dashed rounded-xl bg-zinc-900/20">
            <h3 className="text-xl font-medium text-zinc-400 mb-2">{t("home.loading")}</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {games.map((game: any) => (
              <div key={game.id} className="group flex flex-col bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 hover:bg-zinc-800/50 transition-all duration-300 transform hover:-translate-y-1">
                {/* Game Cover Placeholder / Image */}
                <Link href={`/game/play?id=${game.id}`} className="aspect-video bg-zinc-800 relative overflow-hidden flex items-center justify-center block cursor-pointer group-hover:opacity-90">
                  {game.coverImageUrl ? (
                    <div className="w-full h-full relative group-hover:scale-105 transition-transform duration-500">
                      <img src={game.coverImageUrl} alt={game.title} className="absolute inset-0 w-full h-full object-cover opacity-60" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <Gamepad2 className="w-12 h-12 text-zinc-400 opacity-50 drop-shadow-md" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-700 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                      <Gamepad2 className="w-12 h-12 text-zinc-600" />
                    </div>
                  )}
                  {/* Bookmark Button */}
                  <button 
                    onClick={(e) => toggleBookmark(e, game.id)}
                    className="absolute top-3 right-3 p-2 rounded-full bg-black/50 backdrop-blur-md hover:bg-black/70 transition-colors group/btn z-10"
                  >
                    <Heart className={`w-5 h-5 transition-colors ${bookmarkedGames.has(game.id) ? 'fill-red-500 text-red-500' : 'text-white group-hover/btn:text-red-400'}`} />
                  </button>
                </Link>
                
                <div className="p-5 flex-1 flex flex-col">
                  <Link href={`/game/play?id=${game.id}`}>
                    <h2 className="text-xl font-bold mb-1 group-hover:text-blue-400 transition-colors">{game.title}</h2>
                  </Link>
                  <p className="text-xs text-zinc-400 mb-3 flex items-center gap-1">
                    By <span className="font-semibold">{game.uploader?.username || "Admin"}</span>
                  </p>
                  <p className="text-zinc-500 text-sm mb-6 line-clamp-2 dark:text-zinc-400">{game.description}</p>
                  
                  <Link 
                    href={`/game/play?id=${game.id}`}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    {t("home.play")}
                  </Link>
                </div>
                <div className="p-4 pt-0 text-xs text-zinc-500 mt-auto flex items-center justify-between">
                  <span>{new Date(game.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
