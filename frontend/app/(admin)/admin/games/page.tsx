"use client";

import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Search, Check, X, Star, Trash2, Clock, Play, Pencil } from "lucide-react";

import { fetchAPI } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppDialog } from "@/contexts/DialogContext";

export default function GameManagementPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'published'>('pending');
  const [games, setGames] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  
  const { t } = useLanguage();
  const { notify, confirm } = useAppDialog();

  useEffect(() => {
    setMounted(true);
    fetchAPI('/categories').then(res => setCategories(Array.isArray(res) ? res : res.data || [])).catch(() => {});
  }, []);

  const fetchGames = async (tab: 'pending' | 'published') => {
    setLoading(true);
    try {
      const res = await fetchAPI(`/admin/games/${tab}`);
      setGames(Array.isArray(res) ? res : (res.data || []));
    } catch (err) {
      console.error("Failed to fetch games", err);
      notify({ message: t("game.loadError") || "Failed to fetch games", variant: "error" });
      setGames([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted) fetchGames(activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, mounted]);

  const handleApprove = async (id: string) => {
    const isConfirmed = await confirm({ message: t("admin.approveConfirm") || "Are you sure you want to approve this game?" });
    if (!isConfirmed) return;

    try {
      await fetchAPI(`/admin/games/${id}/approve`, { method: 'PUT' });
      notify({ message: "Game approved successfully", variant: "success" });
      fetchGames(activeTab);
    } catch (err) {
      notify({ message: t("game.loadError") || "Failed to approve game", variant: "error" });
    }
  };

  const handleReject = async (id: string) => {
    const isConfirmed = await confirm({ message: t("admin.rejectPrompt") || "Are you sure you want to reject this game?", variant: "warning" });
    if (!isConfirmed) return;

    try {
      await fetchAPI(`/admin/games/${id}/reject`, { method: 'PUT', body: JSON.stringify({ reason: "Rejected by admin" }) });
      notify({ message: "Game rejected", variant: "success" });
      fetchGames(activeTab);
    } catch (err) {
      notify({ message: t("game.loadError") || "Failed to reject game", variant: "error" });
    }
  };

  const handleFeature = async (id: string) => {
    try {
      await fetchAPI(`/admin/games/${id}/feature`, { method: 'PUT' });
      notify({ message: "Featured status updated", variant: "success" });
      fetchGames(activeTab);
    } catch (err) {
      notify({ message: t("game.loadError") || "Failed to update featured status", variant: "error" });
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({ message: t("admin.deleteConfirm") || "Are you sure you want to delete this game?", variant: "error" });
    if (!isConfirmed) return;

    try {
      await fetchAPI(`/admin/games/${id}`, { method: 'DELETE' });
      notify({ message: "Game deleted", variant: "success" });
      fetchGames(activeTab);
    } catch (err) {
      notify({ message: t("game.loadError") || "Failed to delete game", variant: "error" });
    }
  };

  const handleEditClick = (game: any) => {
    setEditingGame({
      ...game,
      categoryIds: game.categories?.map((c: any) => c.id) || []
    });
    setEditModalOpen(true);
  };

  const handleEditSave = async () => {
    if (!editingGame?.title || !editingGame?.description) {
      notify({ message: "Title and description are required.", variant: "warning" });
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("title", editingGame.title);
      formData.append("description", editingGame.description);
      if (editingGame.categoryIds) {
        formData.append("categoryIds", editingGame.categoryIds.join(','));
      }
      if (editingGame.newCoverFile) {
        formData.append("coverImage", editingGame.newCoverFile);
      }

      await fetchAPI(`/games/${editingGame.id}`, { 
        method: 'PUT', 
        body: formData 
      });
      notify({ message: "Game updated successfully!", variant: "success" });
      setEditModalOpen(false);
      fetchGames(activeTab);
    } catch (err) {
      console.error("Failed to update game", err);
      notify({ message: t("game.loadError") || "Failed to update game", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) return null;

  const filteredGames = games.filter(game => 
    game.title?.toLowerCase().includes(search.toLowerCase()) || 
    game.uploader?.username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t("admin.gamesManagement") || "Games & Content"}</h2>
          <p className="text-muted-foreground mt-1">{t("admin.gamesManagementDesc") || "Manage platform games, review submissions, and toggle featured content."}</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-border">
        <button
          className={`pb-3 px-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'pending' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('pending')}
        >
          {t("admin.pendingGames") || "Pending"}
        </button>
        <button
          className={`pb-3 px-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'published' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('published')}
        >
          {t("admin.publishedGames") || "Published"}
        </button>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6 pb-0 flex flex-row items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("admin.searchGame") || "Search by title or uploader..."}
              className="pl-9 bg-surface/50 border-border"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-4">
          <div className="rounded-md border border-border bg-surface">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>{t("admin.colGame") || "Game"}</TableHead>
                  <TableHead>{t("admin.colUploader") || "Uploader"}</TableHead>
                  {activeTab === 'pending' && <TableHead>{t("admin.colCategories") || "Categories"}</TableHead>}
                  {activeTab === 'published' && <TableHead>{t("admin.gamePlays") || "Plays"}</TableHead>}
                  <TableHead>{t("admin.colDate") || "Date"}</TableHead>
                  <TableHead className="text-right">{t("admin.actions") || "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        Loading...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredGames.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      {t("admin.noGamesFound") || "No games found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredGames.map((game) => (
                    <TableRow key={game.id} className="group hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                            {game.thumbnailUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={game.thumbnailUrl} alt={game.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold">
                                {game.title?.[0] || 'G'}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-foreground truncate">{game.title}</span>
                            {activeTab === 'published' && game.isFeatured && (
                              <Badge variant="default" className="w-fit mt-1 text-[10px] px-1.5 py-0 bg-amber-500/10 text-amber-500 border border-amber-500/20">Featured</Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar size="sm" src={game.uploader?.avatarUrl} fallback={game.uploader?.username?.[0] || "?"} className="w-6 h-6" />
                          <span className="text-sm truncate max-w-[120px]">{game.uploader?.username || "Unknown"}</span>
                        </div>
                      </TableCell>

                      {activeTab === 'pending' && (
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {game.categories?.map((cat: any) => (
                              <Badge key={cat.id} variant="outline" className="text-xs font-normal bg-background/50">
                                {cat.name}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                      )}

                      {activeTab === 'published' && (
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Play className="w-4 h-4" />
                            {game.playCount?.toLocaleString() || 0}
                          </div>
                        </TableCell>
                      )}

                      <TableCell className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(game.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {activeTab === 'pending' ? (
                            <>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
                                onClick={() => handleApprove(game.id)}
                                title={t("admin.approve") || "Approve"}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-error hover:text-error hover:bg-error/10"
                                onClick={() => handleReject(game.id)}
                                title={t("admin.reject") || "Reject"}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={() => handleEditClick(game)}
                                title={t("admin.editGame") || "Edit Game"}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className={`h-8 w-8 ${game.isFeatured ? 'text-amber-500 hover:text-amber-600' : 'text-muted-foreground hover:text-foreground'}`}
                                onClick={() => handleFeature(game.id)}
                                title={t("admin.featureGame") || "Toggle Feature"}
                              >
                                <Star className={`h-4 w-4 ${game.isFeatured ? 'fill-current' : ''}`} />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-muted-foreground hover:text-error hover:bg-error/10"
                                onClick={() => handleDelete(game.id)}
                                title={t("admin.deleteGame") || "Delete Game"}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Edit Game Modal */}
      {editModalOpen && editingGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-surface p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b border-border pb-4 sticky top-0 bg-surface z-10">
              <h2 className="text-xl font-bold text-foreground">{t("admin.editGameTitle") || "Edit Game Information"}</h2>
              <Button variant="ghost" size="icon" onClick={() => setEditModalOpen(false)}>
                <X className="w-5 h-5 text-muted-foreground" />
              </Button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("admin.gameTitle") || "Game Title"}</label>
                  <Input 
                    value={editingGame.title || ''} 
                    onChange={e => setEditingGame({...editingGame, title: e.target.value})}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("admin.coverImage") || "Cover Image (Optional)"}</label>
                  <Input 
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setEditingGame({...editingGame, newCoverFile: e.target.files[0]});
                      }
                    }}
                    className="bg-background cursor-pointer"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("admin.colCategories") || "Categories"}</label>
                <div className="flex flex-wrap gap-3 p-3 rounded-md border border-border bg-background max-h-[120px] overflow-y-auto">
                  {categories.map(cat => (
                    <label key={cat.id} className="flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={editingGame.categoryIds?.includes(cat.id)}
                        onChange={(e) => {
                          const newIds = e.target.checked 
                            ? [...(editingGame.categoryIds || []), cat.id] 
                            : (editingGame.categoryIds || []).filter((id: number) => id !== cat.id);
                          setEditingGame({...editingGame, categoryIds: newIds});
                        }}
                        className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                      />
                      <span className="text-sm text-muted-foreground">{cat.name}</span>
                    </label>
                  ))}
                  {categories.length === 0 && <span className="text-sm text-muted-foreground">No categories available.</span>}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("admin.gameDescription") || "Description"}</label>
                <textarea 
                  value={editingGame.description || ''} 
                  onChange={e => setEditingGame({...editingGame, description: e.target.value})}
                  className="w-full min-h-[120px] rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setEditModalOpen(false)} disabled={saving}>
                {t("admin.cancel") || "Cancel"}
              </Button>
              <Button onClick={handleEditSave} disabled={saving} className="bg-primary text-primary-foreground min-w-[100px]">
                {saving ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                  </div>
                ) : (
                  t("admin.save") || "Save"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
