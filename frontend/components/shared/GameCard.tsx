import Link from "next/link";
import { Star, Play, Bookmark } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

export interface Game {
  id: string;
  title: string;
  creator: string;
  rating: number;
  playCount: number;
  thumbnail: string;
  category: string;
  isNew?: boolean;
}

export function GameCard({ game }: { game: Game }) {
  const { t } = useLanguage();

  return (
    <Link href={`/game/play?id=${game.id}`} className="block h-full">
      <Card className="group relative flex flex-col h-full overflow-hidden bg-surface transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 border-transparent hover:border-border cursor-pointer">
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          <img
            src={game.thumbnail || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop"}
            alt={game.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60" />
          
          {/* Top Badges */}
          <div className="absolute left-3 top-3 flex gap-2">
            {game.isNew && <Badge variant="success">{t("game.new") || "New"}</Badge>}
            <Badge className="bg-black/50 backdrop-blur-md text-white border-white/10 hover:bg-black/60">
              {game.category === "Uncategorized" ? t("game.uncategorized") || "Uncategorized" : game.category}
            </Badge>
          </div>

          {/* Hover Overlay Play Button */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-black/40 backdrop-blur-[2px]">
            <Button size="icon" className="h-14 w-14 rounded-full bg-primary hover:scale-110 transition-transform shadow-lg shadow-primary/40 border-0">
              <Play className="h-6 w-6 ml-1 text-white" />
            </Button>
          </div>
        </div>

        <CardContent className="flex flex-1 flex-col p-4">
          <h3 className="line-clamp-1 text-lg font-bold text-foreground group-hover:text-primary transition-colors">
            {game.title}
          </h3>
          <p className="line-clamp-1 text-sm text-muted-foreground mt-1">
            {t("game.by") || "By"} <span className="hover:underline">{game.creator}</span>
          </p>
        </CardContent>

        <CardFooter className="flex items-center justify-between p-4 pt-0">
          <div className="flex items-center gap-1.5 text-sm font-medium text-amber-500">
            <Star className="h-4 w-4 fill-amber-500" />
            <span>{game.rating.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{game.playCount.toLocaleString()} {(t("game.plays") || "plays").toLowerCase()}</span>
            <button 
              className="text-muted-foreground hover:text-primary transition-colors p-1 rounded-full hover:bg-primary/10 relative z-10"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <Bookmark className="h-4 w-4" />
            </button>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
