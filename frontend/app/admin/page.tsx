"use client";

import { useState, useEffect } from "react";
import { Check, X, Play, Settings, LayoutDashboard, Gamepad2, Users, Tags, Trash2, Ban, Flag } from "lucide-react";
import Link from "next/link";
import Cookies from "js-cookie";
import { useLanguage } from "../../contexts/LanguageContext";

export default function AdminPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState<any>(null);
  const [pendingGames, setPendingGames] = useState<any[]>([]);
  const [publishedGames, setPublishedGames] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // Advanced modules state
  const [storageStats, setStorageStats] = useState<any>(null);
  const [sessionStats, setSessionStats] = useState<any[]>([]);
  const [crashLogs, setCrashLogs] = useState<any[]>([]);
  const [mailTemplates, setMailTemplates] = useState<any[]>([]);
  const [mailCampaigns, setMailCampaigns] = useState<any[]>([]);
  
  const [advancedModalOpen, setAdvancedModalOpen] = useState(false);
  const [advGame, setAdvGame] = useState<any>(null);
  const [advTags, setAdvTags] = useState("");
  const [advVersions, setAdvVersions] = useState<any[]>([]);

  // Modals state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [previewGameId, setPreviewGameId] = useState<string | null>(null);

  const [newCatName, setNewCatName] = useState("");
  const [newCatSlug, setNewCatSlug] = useState("");
  
  const [editCatModalOpen, setEditCatModalOpen] = useState(false);
  const [editCatId, setEditCatId] = useState<number | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatSlug, setEditCatSlug] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const token = Cookies.get("token");

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    if (
      (activeTab === "dashboard" && !stats) ||
      (activeTab === "games" && publishedGames.length === 0) ||
      (activeTab === "pending-games" && pendingGames.length === 0) ||
      (activeTab === "users" && users.length === 0) ||
      (activeTab === "categories" && categories.length === 0) ||
      (activeTab === "reports" && reports.length === 0) ||
      (activeTab === "settings" && Object.keys(settings).length === 0) ||
      (activeTab === "storage" && !storageStats) ||
      (activeTab === "analytics" && crashLogs.length === 0) ||
      (activeTab === "mail" && mailTemplates.length === 0)
    ) {
      setLoading(true);
    }
    
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      if (activeTab === "dashboard") {
        const res = await fetch(`${apiUrl}/api/admin/stats`, { headers });
        if (res.ok) setStats(await res.json());
      } else if (activeTab === "games") {
        const res = await fetch(`${apiUrl}/api/admin/games/published`, { headers });
        if (res.ok) setPublishedGames(await res.json());
      } else if (activeTab === "pending-games") {
        const res = await fetch(`${apiUrl}/api/admin/games/pending`, { headers });
        if (res.ok) setPendingGames(await res.json());
      } else if (activeTab === "users") {
        const res = await fetch(`${apiUrl}/api/admin/users`, { headers });
        if (res.ok) setUsers(await res.json());
      } else if (activeTab === "categories") {
        const res = await fetch(`${apiUrl}/api/categories`, { headers });
        if (res.ok) setCategories(await res.json());
      } else if (activeTab === "reports") {
        const res = await fetch(`${apiUrl}/api/reports/admin`, { headers });
        if (res.ok) setReports(await res.json());
      } else if (activeTab === "settings") {
        const res = await fetch(`${apiUrl}/api/settings`, { headers });
        if (res.ok) setSettings(await res.json());
      } else if (activeTab === "storage") {
        const res = await fetch(`${apiUrl}/api/admin/storage/stats`, { headers });
        if (res.ok) {
          const data = await res.json();
          if(data.success) setStorageStats(data.data);
        }
      } else if (activeTab === "analytics") {
        const res1 = await fetch(`${apiUrl}/api/admin/analytics/sessions`, { headers });
        if (res1.ok) {
          const d1 = await res1.json();
          if(d1.success) setSessionStats(d1.data);
        }
        const res2 = await fetch(`${apiUrl}/api/admin/analytics/crashes`, { headers });
        if (res2.ok) {
          const d2 = await res2.json();
          if(d2.success) setCrashLogs(d2.data);
        }
      } else if (activeTab === "mail") {
        const res1 = await fetch(`${apiUrl}/api/admin/mail/templates`, { headers });
        if (res1.ok) {
          const d1 = await res1.json();
          if(d1.success) setMailTemplates(d1.data);
        }
        const res2 = await fetch(`${apiUrl}/api/admin/mail/campaigns`, { headers });
        if (res2.ok) {
          const d2 = await res2.json();
          if(d2.success) setMailCampaigns(d2.data);
        }
      }
    } catch (error) {
      console.error("Fetch error", error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0 || !bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // --- Game Actions ---
  const approveGame = async (id: string) => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/games/${id}/approve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const rejectGame = async () => {
    if (!selectedGameId) return;
    try {
      const res = await fetch(`${apiUrl}/api/admin/games/${selectedGameId}/reject`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rejectReason })
      });
      if (res.ok) {
        setRejectModalOpen(false);
        setRejectReason("");
        fetchData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const deleteGame = async (id: string) => {
    if (!confirm("Are you sure you want to delete this game permanently? This action removes files from Cloudflare R2.")) return;
    try {
      const res = await fetch(`${apiUrl}/api/admin/games/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const toggleFeatured = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/games/${id}/feature`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isFeatured: !currentStatus })
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const openAdvancedModal = async (game: any) => {
    setAdvGame(game);
    setAdvTags(game.hiddenTags || "");
    setAdvancedModalOpen(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/games/${game.id}/versions`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        if(data.success) setAdvVersions(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const saveAdvancedTags = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/games/${advGame.id}/tags`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: advTags })
      });
      if(res.ok) {
        alert("Saved tags!");
        fetchData();
      }
    } catch (e) {}
  };

  const syncVector = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/ai/sync`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
      if(res.ok) {
        const data = await res.json();
        alert(data.message);
      }
    } catch (e) {}
  };

  const rollbackVersion = async (versionId: number) => {
    if(!confirm(t("admin.advConfirmRollback"))) return;
    try {
      const res = await fetch(`${apiUrl}/api/admin/games/${advGame.id}/versions/${versionId}/rollback`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if(res.ok) {
        alert("Rollback thành công!");
        openAdvancedModal(advGame); // refresh versions
      }
    } catch (e) {}
  };

  // --- User Actions ---
  const toggleBan = async (id: number, currentStatus: boolean) => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/users/${id}/ban`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isBanned: !currentStatus })
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const toggleRole = async (id: number, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      const res = await fetch(`${apiUrl}/api/admin/users/${id}/role`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  // --- Category Actions ---
  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/api/categories`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newCatName, slug: newCatSlug })
      });
      if (res.ok) {
        setNewCatName("");
        setNewCatSlug("");
        alert("Đã thêm thể loại thành công!");
        fetchData();
      } else {
        alert("Thêm thể loại thất bại (có thể đã tồn tại).");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const deleteCategory = async (id: number) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      const res = await fetch(`${apiUrl}/api/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchData();
      else alert("Cannot delete category (maybe games are attached)");
    } catch (error) {
      console.error(error);
    }
  };

  const updateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCatId) return;
    try {
      const res = await fetch(`${apiUrl}/api/categories/${editCatId}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: editCatName, slug: editCatSlug })
      });
      if (res.ok) {
        setEditCatModalOpen(false);
        fetchData();
      } else {
        alert("Failed to update category");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const resolveReport = async (id: number) => {
    try {
      const res = await fetch(`${apiUrl}/api/reports/admin/${id}/resolve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const saveSettings = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/settings`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });
      if (res.ok) alert("Settings saved successfully!");
      else alert("Failed to save settings");
    } catch (error) {
      console.error(error);
    }
  };

  const renderTabContent = () => {
    if (loading && (
      (activeTab === "dashboard" && !stats) ||
      (activeTab === "games" && pendingGames.length === 0 && publishedGames.length === 0) ||
      (activeTab === "users" && users.length === 0) ||
      (activeTab === "categories" && categories.length === 0)
    )) return <div className="text-center py-12 text-zinc-500">Loading...</div>;

    switch (activeTab) {
      case "dashboard":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div 
              onClick={() => setActiveTab('pending-games')}
              className="bg-card border border-border rounded-xl p-6 shadow-sm cursor-pointer hover:border-primary transition-colors"
            >
              <h3 className="text-zinc-500 text-sm font-medium mb-2">{t("admin.statPending")}</h3>
              <p className="text-3xl font-bold text-yellow-500">{stats?.pendingGamesCount || 0}</p>
            </div>
            <div 
              onClick={() => setActiveTab('games')}
              className="bg-card border border-border rounded-xl p-6 shadow-sm cursor-pointer hover:border-emerald-500 transition-colors"
            >
              <h3 className="text-zinc-500 text-sm font-medium mb-2">{t("admin.statPublished")}</h3>
              <p className="text-3xl font-bold text-emerald-500">{stats?.publishedGamesCount || 0}</p>
            </div>
            <div 
              onClick={() => setActiveTab('users')}
              className="bg-card border border-border rounded-xl p-6 shadow-sm cursor-pointer hover:border-blue-500 transition-colors"
            >
              <h3 className="text-zinc-500 text-sm font-medium mb-2">{t("admin.statUsers")}</h3>
              <p className="text-3xl font-bold text-blue-500">{stats?.totalUsersCount || 0}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h3 className="text-zinc-500 text-sm font-medium mb-2">{t("admin.statStorage")}</h3>
              <p className="text-3xl font-bold text-purple-500">{formatBytes(stats?.totalStorageBytes)}</p>
            </div>
          </div>
        );

      case "pending-games":
        return (
          <div className="space-y-8">
            {/* Pending Section */}
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-border bg-muted/30">
                <h3 className="font-semibold">{t("admin.pendingApprovals")}</h3>
              </div>
              <div className="p-0">
                {pendingGames.length === 0 ? (
                  <p className="p-6 text-center text-zinc-500">{t("admin.noPending")}</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {pendingGames.map(game => (
                      <li key={game.id} className="p-4 flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-semibold">{game.title}</h4>
                          <p className="text-sm text-zinc-500">{t("admin.size")}: {formatBytes(Number(game.sizeBytes))} | {t("admin.uploaded")}: {new Date(game.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-2">
                          <Link 
                            href={`/game/play?id=${game.id}`}
                            target="_blank"
                            className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-lg transition-colors flex items-center gap-1 text-sm"
                          >
                            <Play className="w-4 h-4" /> Playtest
                          </Link>
                          <button 
                            onClick={() => approveGame(game.id)}
                            className="p-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-lg transition-colors flex items-center gap-1 text-sm"
                          >
                            <Check className="w-4 h-4" /> Duyệt
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedGameId(game.id);
                              setRejectModalOpen(true);
                            }}
                            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors flex items-center gap-1 text-sm"
                          >
                            <X className="w-4 h-4" /> Từ chối
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        );

      case "games":
        return (
          <div className="space-y-8">

            {/* Published Section */}
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-border bg-muted/30">
                <h3 className="font-semibold">{t("admin.publishedGames")}</h3>
              </div>
              <div className="p-0">
                <ul className="divide-y divide-border">
                  {publishedGames.map(game => (
                    <li key={game.id} className="p-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-white flex items-center gap-2">
                          {game.title}
                          {game.isFeatured && <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-500 text-xs rounded-full border border-yellow-500/20">Featured</span>}
                        </p>
                        <p className="text-sm text-zinc-400">By: User #{game.uploaderId}</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => toggleFeatured(game.id, game.isFeatured)}
                          className={`p-2 border rounded-md transition-colors ${game.isFeatured ? 'border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10' : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800'}`}
                          title={game.isFeatured ? 'Remove Featured' : 'Mark Featured'}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={game.isFeatured ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        </button>
                        <button onClick={() => openAdvancedModal(game)} className="p-2 border border-blue-500/30 text-blue-500 rounded-md hover:bg-blue-500/10" title="Advanced">
                          <Settings className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteGame(game.id)} className="p-2 border border-red-500/30 text-red-500 rounded-md hover:bg-red-500/10" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );

      case "reports":
        return (
          <div className="space-y-8">
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-border bg-muted/30">
                <h3 className="font-semibold">{t("admin.tabReports")}</h3>
              </div>
              <div className="p-0">
                {reports.length === 0 ? (
                  <p className="p-6 text-center text-zinc-500">Chưa có báo cáo nào.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {reports.map(report => (
                      <li key={report.id} className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <p className="font-medium text-white">Game: {report.game?.title}</p>
                            <p className="text-sm text-zinc-400">Người báo cáo: {report.user?.username} ({report.user?.email})</p>
                            <p className="text-sm text-zinc-300 mt-2 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">{report.reason}</p>
                            <p className="text-xs text-zinc-500 mt-2">Ngày: {new Date(report.createdAt).toLocaleString()}</p>
                          </div>
                          <div className="flex flex-col gap-2 shrink-0">
                            {report.status === 'open' ? (
                              <button 
                                onClick={() => resolveReport(report.id)}
                                className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-lg text-sm font-medium transition-colors border border-blue-500/20 flex items-center justify-center"
                              >
                                Đánh dấu {t("admin.reportsResolved")}
                              </button>
                            ) : (
                              <span className="px-3 py-1.5 bg-green-500/10 text-green-500 rounded-lg text-sm font-medium border border-green-500/20 text-center">
                                Đã xử lý
                              </span>
                            )}
                            <button 
                              onClick={() => deleteGame(report.gameId)}
                              className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm font-medium transition-colors border border-red-500/20 flex items-center justify-center gap-1"
                            >
                              <Trash2 className="w-4 h-4" /> Xóa Game
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        );

      case "settings":
        return (
          <div className="space-y-8 max-w-2xl">
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-border bg-muted/30">
                <h3 className="font-semibold flex items-center gap-2"><Settings className="w-5 h-5"/> {t("admin.tabSettings")}</h3>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded border-zinc-700 bg-zinc-800 text-primary focus:ring-primary focus:ring-offset-zinc-900"
                      checked={settings.maintenanceMode === 'true'}
                      onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked ? 'true' : 'false'})}
                    />
                    <span className="font-medium">{t("admin.settingsMaintenance")}</span>
                  </label>
                  <p className="text-sm text-zinc-400 mt-1 ml-8">{t("admin.settingsMaintenanceDesc")}</p>
                </div>
                
                <div>
                  <label className="block font-medium mb-2">{t("admin.settingsUploadLimit")}</label>
                  <input 
                    type="number"
                    min="10"
                    max="1000"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                    value={settings.maxUploadSizeMB || 100}
                    onChange={(e) => setSettings({...settings, maxUploadSizeMB: e.target.value})}
                  />
                  <p className="text-sm text-zinc-400 mt-2">{t("admin.settingsUploadLimitDesc")}</p>
                </div>

                <div className="pt-4 border-t border-zinc-800">
                  <button 
                    onClick={saveSettings}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors"
                  >
                    {t("admin.settingsSave")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case "storage":
        return (
          <div className="space-y-8">
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm p-6">
              <h3 className="font-semibold mb-4 text-xl">{t("admin.storageTitle")}</h3>
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                  <p className="text-sm text-zinc-400 mb-1">{t("admin.storageUsed")}</p>
                  <p className="text-3xl font-bold text-primary">{formatBytes(storageStats?.totalBytesUsed)}</p>
                  <div className="w-full bg-zinc-800 rounded-full h-2 mt-4">
                    <div className="bg-primary h-2 rounded-full" style={{ width: `${Math.min(storageStats?.percentUsed || 0, 100)}%` }}></div>
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">{Math.round(storageStats?.percentUsed || 0)}% of 10GB (Free Tier)</p>
                </div>
              </div>
              <div className="border-t border-zinc-800 pt-6">
                <h4 className="font-semibold mb-2">{t("admin.storageGC")}</h4>
                <p className="text-sm text-zinc-400 mb-4">{t("admin.storageGCDesc")}</p>
                <button 
                  onClick={async () => {
                    if(confirm(t('admin.advConfirmGC'))) {
                      const res = await fetch(`${apiUrl}/api/admin/storage/gc`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }});
                      const data = await res.json();
                      alert(data.message || 'Complete');
                    }
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {t("admin.storageGCBtn")}
                </button>
              </div>
            </div>
          </div>
        );

      case "analytics":
        return (
          <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-border bg-muted/30">
                  <h3 className="font-semibold">Average Session Length</h3>
                </div>
                <ul className="divide-y divide-border">
                  {sessionStats.map(s => (
                    <li key={s.gameId} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{s.gameTitle}</p>
                        <p className="text-xs text-zinc-500">{s.totalSessions} sessions</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{Math.round(s.averageLength)}s</p>
                      </div>
                    </li>
                  ))}
                  {sessionStats.length === 0 && <li className="p-4 text-center text-zinc-500">No session data</li>}
                </ul>
              </div>

              <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-border bg-muted/30">
                  <h3 className="font-semibold">Recent Crash Logs</h3>
                </div>
                <ul className="divide-y divide-border max-h-[500px] overflow-y-auto">
                  {crashLogs.map(c => (
                    <li key={c.id} className="p-4">
                      <p className="font-medium text-red-500 text-sm mb-1">{c.game?.title}</p>
                      <p className="text-xs text-zinc-300 font-mono bg-zinc-900 p-2 rounded border border-zinc-800 break-all">{c.errorMsg}</p>
                      <p className="text-xs text-zinc-600 mt-2">{new Date(c.createdAt).toLocaleString()} | {c.browserInfo}</p>
                    </li>
                  ))}
                  {crashLogs.length === 0 && <li className="p-4 text-center text-zinc-500">No crash logs</li>}
                </ul>
              </div>
            </div>
          </div>
        );

      case "mail":
        return (
          <div className="space-y-8">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4 text-xl">{t("admin.mailTitle")}</h3>
              <p className="text-zinc-400 mb-6 text-sm">{t("admin.mailCreate")}</p>
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const subject = formData.get('subject');
                const body = formData.get('body');
                const target = formData.get('target');
                if(confirm('Chắc chắn gửi chiến dịch này?')) {
                  const res = await fetch(`${apiUrl}/api/admin/mail/campaigns`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ subject, body, targetGroup: target })
                  });
                  if(res.ok) {
                    alert('Đã gửi thành công!');
                    fetchData(); // reload campaigns
                  }
                }
              }} className="space-y-4 max-w-2xl">
                <div>
                  <label className="block text-sm mb-1 text-zinc-400">{t("admin.mailSubject")}</label>
                  <input name="subject" required className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-zinc-400">{t("admin.mailContent")}</label>
                  <textarea name="body" required rows={6} className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md focus:border-primary focus:outline-none"></textarea>
                </div>
                <div>
                  <label className="block text-sm mb-1 text-zinc-400">{t("admin.mailRecipients")}</label>
                  <select name="target" className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md focus:border-primary focus:outline-none">
                    <option value="all">{t("admin.mailAllUsers")}</option>
                    <option value="active">{t("admin.mailActiveUsers")}</option>
                  </select>
                </div>
                <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors">
                  {t("admin.mailSend")}
                </button>
              </form>
            </div>
            
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-border bg-muted/30">
                <h3 className="font-semibold">{t("admin.mailHistory")}</h3>
              </div>
              <ul className="divide-y divide-border">
                {mailCampaigns.map(camp => (
                  <li key={camp.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">{camp.subject}</p>
                      <p className="text-xs text-zinc-400 mt-1">{t("admin.mailSentHeader")}: {camp.sentCount} | {t("admin.mailTargetHeader")}: {camp.targetGroup}</p>
                    </div>
                    <div className="text-right text-xs text-zinc-500">
                      {new Date(camp.createdAt).toLocaleString()}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );

      case "default":
        return <div>Tab not found</div>;

      case "users":
        return (
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="p-4">{t("admin.colUsername")}</th>
                  <th className="p-4">{t("admin.colEmail")}</th>
                  <th className="p-4">{t("admin.colRole")}</th>
                  <th className="p-4">{t("admin.colGames")}</th>
                  <th className="p-4">{t("admin.colStatus")}</th>
                  <th className="p-4 text-right">{t("admin.colActions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-muted/20">
                    <td className="p-4 font-medium">{user.username}</td>
                    <td className="p-4 text-zinc-500">{user.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-500' : 'bg-blue-500/20 text-blue-500'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">{user.gamesUploaded}</td>
                    <td className="p-4">
                      {user.isBanned ? (
                        <span className="text-red-500 font-medium flex items-center gap-1"><Ban className="w-3 h-3"/> {t("admin.banned")}</span>
                      ) : (
                        <span className="text-emerald-500 font-medium">{t("admin.active")}</span>
                      )}
                    </td>
                    <td className="p-4 flex items-center justify-end gap-2">
                      <button onClick={() => toggleRole(user.id, user.role)} className="px-3 py-1 text-xs border border-border rounded hover:bg-muted">
                        {user.role === 'admin' ? t("admin.makeUser") : t("admin.makeAdmin")}
                      </button>
                      <button onClick={() => toggleBan(user.id, user.isBanned)} className={`px-3 py-1 text-xs border rounded ${user.isBanned ? 'border-emerald-500 text-emerald-500 hover:bg-emerald-500/10' : 'border-red-500 text-red-500 hover:bg-red-500/10'}`}>
                        {user.isBanned ? t("admin.unban") : t("admin.ban")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case "categories":
        return (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-4">{t("admin.addNewCat")}</h3>
              <form onSubmit={addCategory} className="space-y-4">
                <div>
                  <label className="block text-sm mb-1 text-zinc-500">{t("admin.catName")}</label>
                  <input required value={newCatName} onChange={e => setNewCatName(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-md" placeholder="e.g. Action RPG"/>
                </div>
                <div>
                  <label className="block text-sm mb-1 text-zinc-500">{t("admin.catSlug")}</label>
                  <input required value={newCatSlug} onChange={e => setNewCatSlug(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-md" placeholder="e.g. action-rpg"/>
                </div>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium w-full">{t("admin.btnCreateCat")}</button>
              </form>
            </div>
            
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-4 border-b border-border bg-muted/30"><h3 className="font-semibold">{t("admin.categories")}</h3></div>
              <ul className="divide-y divide-border">
                {categories.map(cat => (
                  <li key={cat.id} className="p-4 flex items-center justify-between">
                    <div>
                      <span className="font-medium">{cat.name}</span>
                      <span className="text-xs text-zinc-500 ml-2">({cat.slug})</span>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setEditCatId(cat.id);
                          setEditCatName(cat.name);
                          setEditCatSlug(cat.slug);
                          setEditCatModalOpen(true);
                        }}
                        className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-md"
                        title="Edit Category"
                      >
                        <Settings className="w-4 h-4"/>
                      </button>
                      <button onClick={() => deleteCategory(cat.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-md" title="Delete Category">
                        <Trash2 className="w-4 h-4"/>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl flex flex-col md:flex-row gap-8">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 shrink-0">
        <div className="flex items-center gap-3 mb-8 px-2">
          <Settings className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold">{t("admin.title")}</h1>
        </div>
        
        <nav className="space-y-1">
          <div className="p-4 space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-primary/10 text-primary' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
            >
              <LayoutDashboard className="w-4 h-4" /> {t("admin.tabDashboard")}
            </button>
            <div className="pt-2">
              <span className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">{t("admin.tabGames")}</span>
            </div>
            <button
              onClick={() => setActiveTab('games')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors pl-8 ${activeTab === 'games' ? 'bg-primary/10 text-primary' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
            >
              <Gamepad2 className="w-4 h-4" /> {t("admin.tabGamesPublished")}
            </button>
            <button
              onClick={() => setActiveTab('pending-games')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors pl-8 ${activeTab === 'pending-games' ? 'bg-yellow-500/10 text-yellow-500' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
            >
              <Check className="w-4 h-4" /> {t("admin.tabGamesPending")}
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-primary/10 text-primary' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
            >
              <Users className="w-4 h-4" /> {t("admin.tabUsers")}
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'reports' ? 'bg-primary/10 text-primary' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
            >
              <Flag className="w-4 h-4" /> Quản lý Báo cáo
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-primary/10 text-primary' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
            >
              <Settings className="w-4 h-4" /> Cấu hình Hệ thống
            </button>
            <button
              onClick={() => setActiveTab('storage')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'storage' ? 'bg-primary/10 text-primary' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg> Lưu trữ & Băng thông
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'analytics' ? 'bg-primary/10 text-primary' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> {t("admin.tabAnalytics")}
            </button>
            <button
              onClick={() => setActiveTab('mail')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'mail' ? 'bg-primary/10 text-primary' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> Mail Campaigns
            </button>
            <button onClick={() => setActiveTab('categories')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'categories' ? 'bg-primary/10 text-primary' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}>
              <Tags className="w-4 h-4" /> {t("admin.tabCategories")}
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0">
        {renderTabContent()}
      </main>

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-xl shadow-2xl p-6">
            <h3 className="text-lg font-bold mb-4">{t("admin.rejectTitle")}</h3>
            <p className="text-sm text-zinc-500 mb-4">{t("admin.rejectDesc")}</p>
            <textarea
              className="w-full bg-background border border-border rounded-md p-3 text-sm mb-4 min-h-[100px] focus:outline-none focus:border-primary"
              placeholder={t("admin.rejectPlaceholder")}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setRejectModalOpen(false)} className="px-4 py-2 rounded-md text-sm font-medium hover:bg-muted">{t("admin.btnCancel")}</button>
              <button onClick={rejectGame} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-md text-sm font-medium">{t("admin.btnReject")}</button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal (Iframe) */}
      {previewGameId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-5xl bg-black rounded-xl overflow-hidden border border-zinc-800 shadow-2xl flex flex-col h-[80vh]">
            <div className="flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800">
              <h3 className="font-bold">{t("admin.reviewMode")}</h3>
              <button onClick={() => setPreviewGameId(null)} className="p-2 hover:bg-zinc-800 rounded-md text-zinc-400"><X className="w-5 h-5"/></button>
            </div>
            <div className="flex-1 w-full bg-black">
               <iframe 
                 src={`${process.env.NEXT_PUBLIC_R2_URL}/games/${previewGameId}/index.html`} 
                 className="w-full h-full border-none"
                 sandbox="allow-scripts allow-same-origin"
               />
            </div>
          </div>
        </div>
      )}
      {/* Edit Category Modal */}
      {editCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">{t("admin.catEditTitle")}</h3>
              <form onSubmit={updateCategory}>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-zinc-400">{t("admin.catEditName")}</label>
                    <input
                      required
                      type="text"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      value={editCatName}
                      onChange={e => setEditCatName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-zinc-400">{t("admin.catEditSlug")}</label>
                    <input
                      required
                      type="text"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      value={editCatSlug}
                      onChange={e => setEditCatSlug(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditCatModalOpen(false)}
                    className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Game Modal */}
      {advancedModalOpen && advGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
              <h3 className="text-xl font-bold">Advanced: {advGame.title}</h3>
              <button onClick={() => setAdvancedModalOpen(false)} className="text-zinc-400 hover:text-white"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-8">
              {/* AI & Recommendations */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-lg text-blue-400">AI & Recommendations</h4>
                  <button onClick={syncVector} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm transition-colors">{t("admin.advSyncBtn")} Vector DB</button>
                </div>
                <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700/50">
                  <label className="block text-sm text-zinc-400 mb-2">Hidden Tags (Phân tích ngữ nghĩa)</label>
                  <div className="flex gap-2">
                    <input 
                      value={advTags} 
                      onChange={e => setAdvTags(e.target.value)} 
                      placeholder="e.g. mmo, open-world, farming..."
                      className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md focus:outline-none focus:border-blue-500"
                    />
                    <button onClick={saveAdvancedTags} className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-md transition-colors">{t("admin.advSaveTags")}</button>
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">Ngăn cách bởi dấu phẩy. Các tag này giúp AI gợi ý game chính xác hơn mà không hiển thị ra UI.</p>
                </div>
              </section>

              {/* Version Control */}
              <section>
                <h4 className="font-semibold text-lg text-purple-400 mb-4">Quản lý Phiên bản (Version Control)</h4>
                <div className="bg-zinc-800/50 rounded-lg border border-zinc-700/50 overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-900/50 border-b border-zinc-700/50">
                      <tr>
                        <th className="p-3">Version</th>
                        <th className="p-3">Ngày Tải Lên</th>
                        <th className="p-3">Trạng Thái</th>
                        <th className="p-3 text-right">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-700/50">
                      {advVersions.map(v => (
                        <tr key={v.id} className="hover:bg-zinc-800/80">
                          <td className="p-3 font-medium">{v.version}</td>
                          <td className="p-3 text-zinc-400">{new Date(v.createdAt).toLocaleString()}</td>
                          <td className="p-3">
                            {v.isActive ? <span className="text-emerald-500 font-medium text-xs px-2 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">Active</span> : <span className="text-zinc-500 text-xs">Archived</span>}
                          </td>
                          <td className="p-3 text-right">
                            {!v.isActive && (
                              <button onClick={() => rollbackVersion(v.id)} className="px-3 py-1 text-xs border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 rounded transition-colors">
                                Rollback
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {advVersions.length === 0 && (
                        <tr><td colSpan={4} className="p-4 text-center text-zinc-500">No versions found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
