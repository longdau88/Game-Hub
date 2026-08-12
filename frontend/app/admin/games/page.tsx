"use client";

import { useState, useEffect } from "react";
import { Trash2, X } from "lucide-react";
import Cookies from "js-cookie";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function AdminPublishedGamesPage() {
  const { t } = useLanguage();
  const [publishedGames, setPublishedGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [advancedModalOpen, setAdvancedModalOpen] = useState(false);
  const [advGame, setAdvGame] = useState<any>(null);
  const [advTags, setAdvTags] = useState("");
  const [advEngineConfig, setAdvEngineConfig] = useState<any>({});
  const [advVersions, setAdvVersions] = useState<any[]>([]);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const token = Cookies.get("token");

  const formatBytes = (bytes: number) => {
    if (bytes === 0 || !bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/games/published`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setPublishedGames(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const deleteGame = async (id: string) => {
    if (!confirm("Are you sure you want to delete this game permanently? This action removes files from Cloudflare R2.")) return;
    try {
      const res = await fetch(`${apiUrl}/api/admin/games/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchData();
    } catch (error) { console.error(error); }
  };

  const toggleFeatured = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/games/${id}/feature`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: !currentStatus }),
      });
      if (res.ok) fetchData();
    } catch (error) { console.error(error); }
  };

  const openAdvancedModal = async (game: any) => {
    setAdvGame(game);
    setAdvTags(game.hiddenTags || "");
    setAdvEngineConfig(game.engineConfig || {});
    setAdvancedModalOpen(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/games/${game.id}/versions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setAdvVersions(data.data);
      }
    } catch (e) { console.error(e); }
  };

  const saveAdvancedTags = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/games/${advGame.id}/tags`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ tags: advTags }),
      });
      if (res.ok) { alert("Saved tags!"); fetchData(); }
    } catch (e) {}
  };

  const saveEngineConfig = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/creator/games/${advGame.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ engineConfig: JSON.stringify(advEngineConfig) }),
      });
      if (res.ok) { alert("Saved Engine Config!"); fetchData(); }
    } catch (e) {}
  };

  const syncVector = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/ai/sync`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { const data = await res.json(); alert(data.message); }
    } catch (e) {}
  };

  const rollbackVersion = async (versionId: number) => {
    if (!confirm(t("admin.advConfirmRollback"))) return;
    try {
      const res = await fetch(`${apiUrl}/api/admin/games/${advGame.id}/versions/${versionId}/rollback`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { alert("Rollback thành công!"); openAdvancedModal(advGame); }
    } catch (e) {}
  };

  if (loading) return <div className="flex flex-col items-center justify-center py-20 text-zinc-500 dark:text-zinc-400"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div><p className="font-medium">{t("common.loading") || "Đang tải..."}</p></div>;

  return (
    <div className="space-y-8">
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-muted/30">
          <h3 className="font-semibold">{t("admin.publishedGames")}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                <th className="p-4 font-medium text-zinc-600 dark:text-zinc-400">{t("admin.colGame")}</th>
                <th className="p-4 font-medium text-zinc-600 dark:text-zinc-400">{t("admin.size")}</th>
                <th className="p-4 font-medium text-zinc-600 dark:text-zinc-400">{t("admin.colUploader")}</th>
                <th className="p-4 font-medium text-zinc-600 dark:text-zinc-400">{t("admin.colFeatured")}</th>
                <th className="p-4 font-medium text-zinc-600 dark:text-zinc-400">{t("admin.colActions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {publishedGames.map((game) => (
                <tr key={game.id} className="hover:bg-muted/20">
                  <td className="p-4">
                    <p className="font-medium">{game.title}</p>
                    <p className="text-xs text-zinc-500">{new Date(game.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="p-4 text-zinc-600 dark:text-zinc-400">{formatBytes(Number(game.sizeBytes))}</td>
                  <td className="p-4 text-zinc-600 dark:text-zinc-400 text-sm">
                    {game.uploader?.username || game.uploader?.email || `User #${game.uploaderId}`}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => toggleFeatured(game.id, game.isFeatured)}
                      className={`px-2 py-1 rounded text-xs font-medium ${game.isFeatured ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700"}`}
                    >
                      {game.isFeatured ? `★ ${t("admin.featured")}` : `☆ ${t("admin.feature")}`}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openAdvancedModal(game)}
                        className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-md text-xs font-medium transition-colors"
                      >
                        {t("admin.advTitle")}
                      </button>
                      <button
                        onClick={() => deleteGame(game.id)}
                        className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-md transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {publishedGames.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-zinc-500">No published games.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Advanced Game Modal */}
      {advancedModalOpen && advGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-white/50 dark:bg-zinc-900/50">
              <h3 className="text-xl font-bold">Advanced: {advGame.title}</h3>
              <button onClick={() => setAdvancedModalOpen(false)} className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-8">
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-lg text-blue-400">{t("admin.advAISearch")}</h4>
                  <button onClick={syncVector} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-zinc-900 dark:text-white rounded text-sm transition-colors">{t("admin.advSyncBtn")}</button>
                </div>
                <div className="bg-zinc-100/50 dark:bg-zinc-800/50 p-4 rounded-lg border border-zinc-300/50 dark:border-zinc-700/50">
                  <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-2">{t("admin.advHiddenTags")}</label>
                  <div className="flex gap-2">
                    <input
                      value={advTags}
                      onChange={(e) => setAdvTags(e.target.value)}
                      placeholder="e.g. mmo, open-world, farming..."
                      className="flex-1 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500"
                    />
                    <button onClick={saveAdvancedTags} className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-600 text-zinc-900 dark:text-white rounded-md transition-colors">{t("admin.advSaveTags")}</button>
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">{t("admin.advHiddenTagsDesc")}</p>
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-lg text-emerald-400">Engine Config & Tracking</h4>
                </div>
                <div className="bg-zinc-100/50 dark:bg-zinc-800/50 p-4 rounded-lg border border-zinc-300/50 dark:border-zinc-700/50 space-y-4">
                  <div>
                    <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-2">Memory Size (MB)</label>
                    <input
                      type="number"
                      value={advEngineConfig?.memorySize || ""}
                      onChange={(e) => setAdvEngineConfig({ ...advEngineConfig, memorySize: parseInt(e.target.value) })}
                      placeholder="e.g. 256"
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-2">Firebase Analytics Tracking ID</label>
                    <input
                      value={advEngineConfig?.firebaseTrackingId || ""}
                      onChange={(e) => setAdvEngineConfig({ ...advEngineConfig, firebaseTrackingId: e.target.value })}
                      placeholder="e.g. G-12345678"
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button onClick={saveEngineConfig} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-zinc-900 dark:text-white rounded-md transition-colors font-medium">Save Engine Config</button>
                  </div>
                </div>
              </section>

              <section>
                <h4 className="font-semibold text-lg text-purple-400 mb-4">{t("admin.advVersionControl")}</h4>
                <div className="bg-zinc-100/50 dark:bg-zinc-800/50 rounded-lg border border-zinc-300/50 dark:border-zinc-700/50 overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white/50 dark:bg-zinc-900/50 border-b border-zinc-300/50 dark:border-zinc-700/50">
                      <tr>
                        <th className="p-3">Version</th>
                        <th className="p-3">{t("admin.uploaded")}</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">{t("admin.colActions")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-700/50">
                      {advVersions.map((v) => (
                        <tr key={v.id} className="hover:bg-zinc-100/80 dark:bg-zinc-800/80">
                          <td className="p-3 font-medium">{v.version}</td>
                          <td className="p-3 text-zinc-600 dark:text-zinc-400">{new Date(v.createdAt).toLocaleString()}</td>
                          <td className="p-3">
                            {v.isActive ? (
                              <span className="text-emerald-500 font-medium text-xs px-2 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">Active</span>
                            ) : (
                              <span className="text-zinc-500 text-xs">Archived</span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            {!v.isActive && (
                              <button onClick={() => rollbackVersion(v.id)} className="px-3 py-1 text-xs border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 rounded transition-colors">
                                {t("admin.advRollbackBtn")}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {advVersions.length === 0 && (
                        <tr><td colSpan={4} className="p-4 text-center text-zinc-500">{t("admin.advNoVersions")}</td></tr>
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

