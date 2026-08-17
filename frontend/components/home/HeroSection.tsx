"use client";

import Link from "next/link";
import { Play, Heart, Flame, Star } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { motion } from "framer-motion";

interface HeroSectionProps {
  featuredGames: any[];
  bookmarkedGames: Set<string>;
  onToggleBookmark: (e: React.MouseEvent, gameId: string) => void;
}

export default function HeroSection({ featuredGames, bookmarkedGames, onToggleBookmark }: HeroSectionProps) {
  const { locale: language } = useLanguage();

  if (!featuredGames || featuredGames.length === 0) return null;

  return (
    <motion.section 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="mb-20 relative"
    >
      {/* Vibrant Background glow effects */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-purple-400/40 to-pink-400/40 dark:from-purple-600/20 dark:to-pink-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-l from-blue-400/40 to-cyan-400/40 dark:from-blue-600/20 dark:to-cyan-600/20 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-stretch bg-white/40 dark:bg-zinc-900/30 border border-white/50 dark:border-white/5 p-4 md:p-6 rounded-[2.5rem] backdrop-blur-2xl shadow-[0_8px_40px_rgb(0,0,0,0.04)] dark:shadow-none">
        {/* Main Featured Game */}
        <div className="w-full lg:w-2/3 flex">
          <Link href={`/game/play?id=${featuredGames[0].id}`} className="group relative block rounded-3xl overflow-hidden min-h-[400px] sm:aspect-video shadow-2xl flex flex-col justify-end w-full">
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 sm:via-black/20 to-transparent z-10" />
            <img 
              src={featuredGames[0].coverImageUrl || '/placeholder.png'} 
              alt={featuredGames[0].title} 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
            />
            
            <div className="relative p-5 sm:p-8 md:p-12 z-20 w-full max-w-3xl mt-auto">
              <div className="flex gap-2 mb-4">
                <span className="px-3 py-1 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-lg flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" /> Featured
                </span>
                {featuredGames[0].categories?.[0] && (
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold text-white border border-white/20">
                    {featuredGames[0].categories[0].nameTranslations?.[language] || featuredGames[0].categories[0].name}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-4xl md:text-6xl font-black text-white mb-2 sm:mb-4 leading-tight drop-shadow-lg">
                {featuredGames[0].title}
              </h1>
              <p className="text-zinc-200 text-sm sm:text-lg md:text-xl mb-4 sm:mb-8 line-clamp-2 md:line-clamp-3 font-medium drop-shadow-md">
                {featuredGames[0].descriptionTranslations?.[language] || featuredGames[0].description}
              </p>
              
              <div className="flex gap-2 sm:gap-4">
                <div role="button" onClick={(e) => { e.preventDefault(); /* Add play action */ }} className="px-4 py-2.5 sm:px-8 sm:py-4 bg-white text-black hover:bg-zinc-200 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-lg flex items-center gap-2 sm:gap-3 transition-transform hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                  <Play className="w-4 h-4 sm:w-6 sm:h-6 fill-current" /> Play Now
                </div>
                <div 
                  role="button"
                  onClick={(e) => { e.preventDefault(); onToggleBookmark(e, featuredGames[0].id); }}
                  className="px-3 py-2.5 sm:px-6 sm:py-4 bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 text-white rounded-xl sm:rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 group"
                >
                  <Heart className={`w-4 h-4 sm:w-6 sm:h-6 transition-colors ${bookmarkedGames.has(featuredGames[0].id) ? 'fill-red-500 text-red-500' : 'group-hover:text-pink-400'}`} />
                </div>
              </div>
            </div>
          </Link>
        </div>
        
        {/* Sidebar Featured Games */}
        <div className="w-full lg:w-1/3 flex flex-col gap-4">
          {featuredGames.slice(1, 4).map((game) => (
            <Link href={`/game/play?id=${game.id}`} key={`side-${game.id}`} className="group flex-1 flex items-center gap-4 bg-white/80 dark:bg-black/40 hover:bg-white dark:hover:bg-zinc-800/80 border border-white/60 dark:border-white/5 hover:border-blue-200 dark:hover:border-white/10 p-3 rounded-3xl transition-all duration-300 shadow-sm hover:shadow-md">
              <div className="w-24 h-24 md:w-28 md:h-28 aspect-square md:aspect-auto rounded-xl overflow-hidden relative shrink-0">
                <img src={game.coverImageUrl || '/placeholder.png'} alt={game.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="flex-1 py-2 pr-2">
                <h3 className="font-bold text-zinc-900 dark:text-white text-lg mb-1 group-hover:text-blue-400 transition-colors line-clamp-1">{game.title}</h3>
                <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 mb-2">
                  <span className="text-yellow-500 flex items-center"><Star className="w-3 h-3 fill-current mr-1" /> {game.averageRating > 0 ? game.averageRating : 'New'}</span>
                  <span>•</span>
                  <span>{game.categories?.[0]?.nameTranslations?.[language] || game.categories?.[0]?.name || 'Game'}</span>
                </div>
                <p className="text-xs text-zinc-500 line-clamp-2">{game.descriptionTranslations?.[language] || game.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
