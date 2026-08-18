"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { GameCard, Game } from "@/components/shared/GameCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Play, Heart, BookmarkPlus, Flag, Star, Users, Calendar, Monitor, Smartphone, Keyboard, MessageSquare, Loader2 } from "lucide-react";
import { GameService } from "@/services/GameService";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export default function GameDetailPage() {
  const params = useParams();
  const [mounted, setMounted] = useState(false);
  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { t } = useLanguage();
  
  useEffect(() => {
    setMounted(true);
    if (params?.id) {
      GameService.getGameDetails(params.id as string)
        .then((data) => {
          setGame(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setError("Failed to load game details");
          setLoading(false);
        });
    }
  }, [params?.id]);
  
  if (!mounted) return null;
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error || !game) {
    return <div className="text-center py-20 text-error">{error || t("game.notFound") || "Game not found"}</div>;
  }

  const creatorName = game.uploader?.username || t("game.unknown") || "Unknown";
  const displayRating = (game.averageRating || game.rating || 0).toFixed(1);
  const displayPlays = (game.playCount || 0).toLocaleString();

  return (
    <div className="flex flex-col pb-20">
      
      {/* Hero Banner Area */}
      <div className="relative w-full h-[400px] md:h-[500px] rounded-3xl overflow-hidden mb-8 border border-border">
        <img 
          src={game.coverImageUrl || "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=1600&q=80"} 
          alt={game.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Blur overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex gap-6 items-end">
            <div className="w-32 h-32 md:w-48 md:h-48 rounded-2xl overflow-hidden shadow-2xl border-4 border-background shrink-0 relative hidden sm:block">
              <img src={game.coverImageUrl || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80"} alt="Thumbnail" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                {game.categories?.length ? (
                  game.categories.map((c: any, idx: number) => (
                    <Badge key={idx} variant={idx === 0 ? "success" : "secondary"} className={idx === 0 ? "bg-success/20 text-success border-success/30" : ""}>
                      {c.category?.name || c.name || t("game.uncategorized") || "Uncategorized"}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="secondary">{t("game.uncategorized") || "Uncategorized"}</Badge>
                )}
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-foreground drop-shadow-lg">{game.title}</h1>
              <div className="flex items-center gap-4 text-muted-foreground mt-2">
                <div className="flex items-center gap-1.5 hover:text-foreground cursor-pointer transition-colors">
                  <Avatar size="sm" fallback={creatorName[0]} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${creatorName}`} />
                  <span className="font-semibold">{creatorName}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1 text-amber-500 font-bold">
                  <Star className="w-4 h-4 fill-amber-500" /> {displayRating}
                </div>
                <span>•</span>
                <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {displayPlays} {t("game.plays")?.toLowerCase() || "plays"}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
            <Link href={`/game/play?id=${game.id}`} className="w-full sm:w-auto">
              <Button size="lg" className="w-full h-14 px-8 text-lg rounded-2xl shadow-lg shadow-primary/30">
                <Play className="w-6 h-6 mr-2 fill-current" /> {t("game.playGame") || "Play Game"}
              </Button>
            </Link>
            <div className="flex gap-3 w-full sm:w-auto">
              <Button size="icon" variant="glass" className="h-14 w-14 rounded-2xl" onClick={() => setIsLiked(!isLiked)}>
                <Heart className={cn("w-6 h-6", isLiked && "fill-error text-error")} />
              </Button>
              <Button size="icon" variant="glass" className="h-14 w-14 rounded-2xl" onClick={() => setIsSaved(!isSaved)}>
                <BookmarkPlus className={cn("w-6 h-6", isSaved && "fill-primary text-primary")} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mt-8">
        {/* Main Content (Left) */}
        <div className="lg:col-span-2 space-y-12">
          
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">{t("game.about") || "About This Game"}</h2>
            <div className="prose prose-zinc dark:prose-invert max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {game.description || t("game.noDescription") || "No description provided for this game."}
            </div>
          </section>
        </div>

        {/* Sidebar Info (Right) */}
        <div className="space-y-8">
          <div className="p-6 rounded-2xl bg-surface border border-border space-y-6">
            <h3 className="font-bold text-lg border-b border-border pb-2">{t("game.details") || "Game Details"}</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Monitor className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-semibold">{t("game.platforms") || "Platforms"}</p>
                  <p className="text-sm text-muted-foreground">Desktop, Mobile Web</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Keyboard className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-semibold">{t("game.controls") || "Controls"}</p>
                  <p className="text-sm text-muted-foreground">Keyboard & Mouse, Touch</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-semibold">{t("game.updated") || "Updated"}</p>
                  <p className="text-sm text-muted-foreground">
                    {game.createdAt ? new Date(game.createdAt).toLocaleDateString() : t("game.unknown") || "Unknown"}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border flex justify-between gap-2">
              <Button variant="outline" className="flex-1 text-muted-foreground">
                <Flag className="w-4 h-4 mr-2" /> {t("game.report") || "Report"}
              </Button>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-surface border border-border space-y-6">
            <div className="flex items-center gap-4">
              <Avatar size="lg" fallback={creatorName[0]} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${creatorName}`} />
              <div>
                <p className="text-sm text-muted-foreground">{t("game.creator") || "Creator"}</p>
                <p className="font-bold text-lg">{creatorName}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button className="w-full" variant="secondary">{t("game.follow") || "Follow"}</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
