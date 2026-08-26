"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Gamepad2, Search, Plus, MoreVertical, Edit, Trash, BarChart2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchAPI } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppDialog } from "@/contexts/DialogContext";

export default function CreatorGamesPage() {
  const [mounted, setMounted] = useState(false);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { t } = useLanguage();
  const router = useRouter();
  const { notify, confirm } = useAppDialog();

  useEffect(() => {
    setMounted(true);
    const loadGames = async () => {
      try {
        const res = await fetchAPI('/games/creator/games');
        if (res.data) setGames(res.data);
      } catch (err) {
        console.error("Failed to load games:", err);
      } finally {
        setLoading(false);
      }
    };
    loadGames();
  }, []);

  if (!mounted) return null;

  
  const handleDelete = async (id: string) => {
    if (await confirm({ title: t("creator.deleteConfirmTitle") || "Delete Game", message: t("creator.deleteConfirmDesc") || "Are you sure you want to delete this game? This action cannot be undone." })) {
      try {
        await fetchAPI(`/games/${id}`, { method: 'DELETE' });
        setGames(games.filter(g => g.id !== id));
        notify({ message: t("creator.deleteSuccess") || "Game deleted successfully", variant: "success" });
      } catch (err: any) {
        notify({ message: err.message || t("creator.deleteFailed") || "Failed to delete game", variant: "error" });
      }
    }
  };

  const filteredGames = games.filter(g => g.title?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-8 pb-10">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("profile.uploadedGames") || "My Games"}</h1>
          <p className="text-muted-foreground mt-1">{t("creator.myGamesDesc") || "Manage your game portfolio and track performance."}</p>
        </div>
        <Link href="/creator/games/new">
          <Button className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            {t("creator.uploadNewGame") || "Upload New Game"}
          </Button>
        </Link>
      </div>

      <Card className="bg-surface/50 border-border">
        <div className="p-4 border-b border-border flex items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder={t("creator.searchGames") || "Search games..."} 
              className="pl-9 bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">{t("loading") || "Loading..."}</div>
          ) : filteredGames.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-4">
                <Gamepad2 className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">{t("creator.noGamesFound") || "No games found"}</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                {searchQuery ? (t("creator.tryDifferentSearch") || "Try a different search term") : (t("creator.startByUploading") || "Start building your portfolio by uploading your first game.")}
              </p>
              {!searchQuery && (
                <Link href="/creator/games/new">
                  <Button variant="outline">{t("creator.uploadNewGame") || "Upload New Game"}</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredGames.map((game) => (
                <div key={game.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <img 
                      src={game.coverImageUrl || "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&q=80"} 
                      alt={game.title}
                      className="w-20 h-20 rounded-xl object-cover bg-surface"
                    />
                    <div>
                      <h3 className="font-bold text-lg">{game.title}</h3>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                        <Badge 
                          variant={game.status === 'published' ? "success" : game.status === 'rejected' ? "destructive" : game.status === 'processing' ? "secondary" : "warning"} 
                          className="text-[10px] uppercase font-bold"
                        >
                          {game.status === 'published' ? (t("creator.published") || "Published") 
                            : game.status === 'rejected' ? (t("creator.rejected") || "Rejected")
                            : game.status === 'processing' ? (t("creator.processing") || "Processing")
                            : (t("creator.inReview") || "In Review")}
                        </Badge>
                        <span className="flex items-center gap-1">
                          <Gamepad2 className="w-4 h-4" /> {game.playCount || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          ⭐ {game.averageRating?.toFixed(1) || "0.0"}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Button variant="ghost" size="sm" title={t("creator.analytics") || "Analytics"} onClick={() => router.push(`/creator/analytics?gameId=${game.id}`)}>
                      <BarChart2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="sm" title={t("creator.edit") || "Edit"} onClick={() => router.push(`/creator/games/edit?id=${game.id}`)}>
                      <Edit className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:text-error" title={t("creator.delete") || "Delete"} onClick={() => handleDelete(game.id)}>
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
