"use client";

import { useState, useEffect } from "react";
import { GameCard, Game } from "@/components/shared/GameCard";
import { Search, Library as LibraryIcon, PlayCircle, Heart, Clock, Folder, FolderPlus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";

import { fetchAPI } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppDialog } from "@/contexts/DialogContext";

export default function LibraryPage() {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [recentGames, setRecentGames] = useState<Game[]>([]);
  const [savedGames, setSavedGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Collections state
  const [collections, setCollections] = useState<any[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | 'all'>('all');
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  
  const { locale: language, t } = useLanguage();
  const { confirm, notify } = useAppDialog();

  useEffect(() => {
    setMounted(true);
    // Use correct user library endpoints
    Promise.all([
      fetchAPI('/games/user/history').catch(() => []),
      fetchAPI('/games/user/bookmarked').catch(() => []),
      fetchAPI('/collections').catch(() => [])
    ]).then(([recentRes, savedRes, colRes]) => {
       const recentArray = Array.isArray(recentRes) ? recentRes : (recentRes?.data || []);
       const savedArray = Array.isArray(savedRes) ? savedRes : (savedRes?.data || []);
       
       setCollections(Array.isArray(colRes) ? colRes : (colRes?.data || []));

       const mapGame = (g: any) => ({
          id: g.id,
          title: g.title,
          creator: g.uploader?.username || "Unknown",
          rating: g.averageRating || 0,
          playCount: g.playCount || 0,
          thumbnail: g.coverImageUrl || "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&q=80",
          category: g.categories?.[0]?.nameTranslations?.[language] || g.categories?.[0]?.name || "Uncategorized",
          collectionId: g.collectionId
       });
       setRecentGames(recentArray.map(mapGame));
       setSavedGames(savedArray.map(mapGame));
    }).finally(() => setLoading(false));
  }, [language]);

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;
    try {
      const data = await fetchAPI('/collections', {
        method: "POST",
        body: JSON.stringify({ name: newCollectionName })
      });
      setCollections([...collections, data]);
      setNewCollectionName("");
      setIsCreatingCollection(false);
      await notify({ message: "Collection created", variant: "success" });
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteCollection = async (collectionId: number) => {
    if (!await confirm({ message: "Are you sure you want to delete this folder? Games will be moved to Uncategorized.", variant: "warning" })) return;
    try {
      await fetchAPI(`/collections/${collectionId}`, { method: "DELETE" });
      setCollections(collections.filter(c => c.id !== collectionId));
      if (selectedCollectionId === collectionId) setSelectedCollectionId('all');
      await notify({ message: "Collection deleted", variant: "success" });
      
      // Update saved games locally (move deleted collection games to uncategorized)
      setSavedGames(prev => prev.map(g => g.collectionId === collectionId ? { ...g, collectionId: null } : g));
    } catch (error) {
      console.error(error);
    }
  };

  const filteredRecentGames = recentGames.filter(g => g.title.toLowerCase().includes(search.toLowerCase()));
  const filteredSavedGames = savedGames.filter(g => {
    const matchesSearch = g.title.toLowerCase().includes(search.toLowerCase());
    const matchesCollection = selectedCollectionId === 'all' 
      ? true 
      : selectedCollectionId === null 
        ? !g.collectionId 
        : g.collectionId === selectedCollectionId;
    return matchesSearch && matchesCollection;
  });

  if (!mounted) return null;

  return (
    <div className="flex flex-col space-y-10 pb-10">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight">{t("my_library") || "My Library"}</h1>
          <p className="text-muted-foreground mt-1">{t("library_subtitle") || "Your recent plays and saved collections."}</p>
        </div>
        
        <div className="relative w-full md:w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            className="w-full pl-9 bg-surface border-border"
            placeholder={t("search_library") || "Search your library..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <Clock className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-bold">{t("recently_played") || "Recently Played"}</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {loading ? (
             <p className="text-muted-foreground col-span-full">{t("loading") || "Loading..."}</p>
          ) : filteredRecentGames.length > 0 ? (
            filteredRecentGames.map(game => (
              <GameCard key={game.id} game={game} />
            ))
          ) : (
            <div className="col-span-full py-12 text-center border border-dashed border-border rounded-xl">
              <p className="text-muted-foreground font-semibold">{t("not_available") || "Chưa có"}</p>
              <p className="text-sm text-muted-foreground/70">{t("no_recent_games") || "No recent games found."}</p>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-2">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-error" />
            <h2 className="text-2xl font-bold">{t("saved_games") || "Saved Games"}</h2>
          </div>
          
          {/* Folder Navigation */}
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar w-full md:w-auto">
            <button 
              onClick={() => setSelectedCollectionId('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedCollectionId === 'all' ? 'bg-primary/10 text-primary' : 'bg-surface text-muted-foreground hover:bg-secondary'}`}
            >
              All
            </button>
            <button 
              onClick={() => setSelectedCollectionId(null as any)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedCollectionId === null ? 'bg-primary/10 text-primary' : 'bg-surface text-muted-foreground hover:bg-secondary'}`}
            >
              Uncategorized
            </button>
            {collections.map(c => (
              <div key={c.id} className="flex items-center gap-1">
                <button 
                  onClick={() => setSelectedCollectionId(c.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedCollectionId === c.id ? 'bg-primary/10 text-primary' : 'bg-surface text-muted-foreground hover:bg-secondary'}`}
                >
                  <Folder className="w-3.5 h-3.5" /> {c.name}
                </button>
                {selectedCollectionId === c.id && (
                  <button onClick={() => handleDeleteCollection(c.id)} className="p-1.5 text-muted-foreground hover:text-error hover:bg-error/10 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            
            {!isCreatingCollection ? (
              <button onClick={() => setIsCreatingCollection(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap bg-surface text-muted-foreground hover:bg-secondary transition-colors border border-dashed border-border">
                <FolderPlus className="w-3.5 h-3.5" /> New
              </button>
            ) : (
              <form onSubmit={handleCreateCollection} className="flex items-center gap-2">
                <input type="text" autoFocus value={newCollectionName} onChange={e => setNewCollectionName(e.target.value)} placeholder="Folder name..." className="px-3 py-1.5 text-sm bg-background border border-border rounded-lg outline-none focus:border-primary w-32" />
                <button type="submit" className="px-2 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg">Save</button>
                <button type="button" onClick={() => setIsCreatingCollection(false)} className="px-2 py-1.5 text-sm font-medium bg-surface text-muted-foreground rounded-lg">Cancel</button>
              </form>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {loading ? (
             <p className="text-muted-foreground col-span-full">{t("loading") || "Loading..."}</p>
          ) : filteredSavedGames.length > 0 ? (
            filteredSavedGames.map(game => (
              <GameCard key={game.id} game={game} />
            ))
          ) : (
            <div className="col-span-full py-12 text-center border border-dashed border-border rounded-xl">
              <p className="text-muted-foreground font-semibold">{t("not_available") || "Chưa có"}</p>
              <p className="text-sm text-muted-foreground/70">{t("no_saved_games") || "You haven't saved any games yet."}</p>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
