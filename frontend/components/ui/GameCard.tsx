"use client";

import Link from "next/link";
import { Play, Gamepad2, Heart, Star } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { motion } from "framer-motion";

interface GameCardProps {
  game: any;
  isBookmarked: boolean;
  onToggleBookmark: (e: React.MouseEvent, gameId: string) => void;
}

export default function GameCard({ game, isBookmarked, onToggleBookmark }: GameCardProps) {
  const { locale: language, t } = useLanguage();

  return (
    <motion.div 
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group relative flex flex-col h-full bg-white/70 dark:bg-zinc-900/40 backdrop-blur-xl border border-white/40 dark:border-zinc-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none rounded-[1.5rem] overflow-hidden hover:border-blue-400/50 hover:shadow-[0_12px_40px_rgba(59,130,246,0.15)] transition-all duration-300"
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
          onClick={(e) => onToggleBookmark(e, game.id)}
          className="absolute top-3 right-3 p-2 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/80 transition-colors group/btn z-10 border border-black/10 dark:border-white/10"
        >
          <Heart className={`w-4 h-4 transition-colors ${isBookmarked ? 'fill-pink-500 text-pink-500' : 'text-white group-hover/btn:text-pink-400'}`} />
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
}
