"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Zap, ArrowLeft, Play, Heart, Star, Gamepad2 } from "lucide-react";
import { useLanguage } from "../../../contexts/LanguageContext";
import Cookies from "js-cookie";
import { motion } from "framer-motion";

export default function NewGamesPage() {
  const { locale: language, t } = useLanguage();
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookmarkedGames, setBookmarkedGames] = useState<Set<string>>(new Set());

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const token = Cookies.get("token");
    const headers: HeadersInit = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    fetch(`${apiUrl}/api/games?sort=newest&limit=50`, { headers })
      .then((res) => res.json())
      .then((data) => {
        setGames(Array.isArray(data) ? data : data.games || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    if (token) {
      fetch(`${apiUrl}/api/games/user/bookmarked`, { headers })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setBookmarkedGames(new Set(data.map((g: any) => g.gameId || g.id)));
        })
        .catch(console.error);
    }
  }, []);

  const toggleBookmark = async (e: React.MouseEvent, gameId: string) => {
    e.preventDefault();
    const token = Cookies.get("token");
    if (!token) { alert("Vui lòng đăng nhập để lưu game!"); return; }
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const res = await fetch(`${apiUrl}/api/games/${gameId}/bookmark`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const newSet = new Set(bookmarkedGames);
        data.bookmarked ? newSet.add(gameId) : newSet.delete(gameId);
        setBookmarkedGames(newSet);
      }
    } catch {}
  };

  return (
    <div className="min-h-screen py-8">
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> {t("game.backToStore") || "Về trang chủ"}
        </Link>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl shadow-purple-500/30">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black">{t("home.newReleases") || "Mới Phát Hành"}</h1>
            <p className="text-zinc-500 mt-1">{games.length} game mới nhất</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-zinc-100 dark:bg-zinc-800 animate-pulse aspect-[4/5]" />
          ))}
        </div>
      ) : games.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-zinc-500">
          <Gamepad2 className="w-16 h-16 mb-4 opacity-20" />
          <p className="text-lg font-medium">Chưa có game nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {games.map((game, idx) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(idx * 0.04, 0.5) }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="group relative flex flex-col bg-white/50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl overflow-hidden hover:border-purple-400/50 hover:shadow-[0_0_25px_rgba(168,85,247,0.15)] transition-all duration-300"
            >
              <Link href={`/game/play?id=${game.id}`} className="aspect-[4/3] relative overflow-hidden block">
                {game.coverImageUrl ? (
                  <img src={game.coverImageUrl} alt={game.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-zinc-200 dark:from-zinc-800 to-zinc-300 dark:to-zinc-900 flex items-center justify-center">
                    <Gamepad2 className="w-10 h-10 text-zinc-400" />
                  </div>
                )}
                {/* NEW badge */}
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500 text-white shadow-lg uppercase tracking-wider">
                  New
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
                  <div className="w-12 h-12 rounded-full bg-purple-500/90 flex items-center justify-center shadow-lg scale-75 group-hover:scale-100 transition-transform">
                    <Play className="w-6 h-6 fill-white text-white ml-0.5" />
                  </div>
                </div>
                <button onClick={(e) => toggleBookmark(e, game.id)} className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/70 transition-colors z-10">
                  <Heart className={`w-3.5 h-3.5 transition-colors ${bookmarkedGames.has(game.id) ? 'fill-pink-500 text-pink-500' : 'text-white'}`} />
                </button>
              </Link>
              <div className="p-3 flex-1 flex flex-col">
                <Link href={`/game/play?id=${game.id}`}>
                  <h2 className="font-bold text-sm text-zinc-900 dark:text-white line-clamp-1 group-hover:text-purple-500 transition-colors mb-1">{game.title}</h2>
                </Link>
                <div className="flex items-center justify-between text-xs text-zinc-500 mt-auto">
                  <span>{new Date(game.createdAt).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1 text-yellow-500 font-semibold"><Star className="w-3 h-3 fill-current" /> {game.averageRating > 0 ? game.averageRating : "New"}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
