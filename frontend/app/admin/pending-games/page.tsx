"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Check, X, Play } from "lucide-react";
import Cookies from "js-cookie";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function AdminPendingGamesPage() {
  const { t } = useLanguage();
  const [pendingGames, setPendingGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
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
      const res = await fetch(`${apiUrl}/api/admin/games/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setPendingGames(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const approveGame = async (id: string) => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/games/${id}/approve`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchData();
    } catch (error) { console.error(error); }
  };

  const rejectGame = async () => {
    if (!selectedGameId) return;
    try {
      const res = await fetch(`${apiUrl}/api/admin/games/${selectedGameId}/reject`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ rejectReason }),
      });
      if (res.ok) {
        setRejectModalOpen(false);
        setRejectReason("");
        fetchData();
      }
    } catch (error) { console.error(error); }
  };

  if (loading) return <div className="text-center py-12 text-zinc-500">Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-muted/30">
          <h3 className="font-semibold">{t("admin.pendingApprovals")}</h3>
        </div>
        <div className="p-0">
          {pendingGames.length === 0 ? (
            <p className="p-6 text-center text-zinc-500">{t("admin.noPending")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {pendingGames.map((game) => (
                <li key={game.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold">{game.title}</h4>
                    <p className="text-sm text-zinc-500">
                      {t("admin.size")}: {formatBytes(Number(game.sizeBytes))} |{" "}
                      {t("admin.uploaded")}: {new Date(game.createdAt).toLocaleDateString()}
                    </p>
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
                      <Check className="w-4 h-4" /> {t("admin.approve")}
                    </button>
                    <button
                      onClick={() => { setSelectedGameId(game.id); setRejectModalOpen(true); }}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors flex items-center gap-1 text-sm"
                    >
                      <X className="w-4 h-4" /> {t("admin.btnReject")}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {rejectModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-xl shadow-2xl p-6">
            <h3 className="text-lg font-bold mb-4">{t("admin.rejectTitle")}</h3>
            <p className="text-sm text-zinc-500 mb-4">{t("admin.rejectDesc")}</p>
            <textarea
              className="w-full bg-background border border-border rounded-md p-3 text-sm mb-4 min-h-[100px] focus:outline-none focus:border-primary"
              placeholder={t("admin.rejectPlaceholder")}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setRejectModalOpen(false)} className="px-4 py-2 rounded-md text-sm font-medium hover:bg-muted">
                {t("admin.btnCancel")}
              </button>
              <button onClick={rejectGame} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-md text-sm font-medium">
                {t("admin.btnReject")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
