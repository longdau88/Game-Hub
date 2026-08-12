"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { Trash2 } from "lucide-react";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useAppDialog } from "../../../contexts/DialogContext";

export default function AdminGamificationPage() {
  const { t } = useLanguage();
  const { confirm, notify } = useAppDialog();
  const [badges, setBadges] = useState<any[]>([]);
  const [newBadgeName, setNewBadgeName] = useState("");
  const [newBadgeDesc, setNewBadgeDesc] = useState("");
  const [newBadgeIcon, setNewBadgeIcon] = useState("");
  const [loading, setLoading] = useState(true);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const token = Cookies.get("token");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/gamification/admin/badges`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setBadges(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const addBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/api/gamification/admin/badges`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: newBadgeName, description: newBadgeDesc, iconUrl: newBadgeIcon }),
      });
      if (res.ok) {
        setNewBadgeName(""); setNewBadgeDesc(""); setNewBadgeIcon("");
        await notify({ message: t("admin.badgeAdded"), variant: "success" });
        fetchData();
      } else {
        const data = await res.json();
        await notify({ message: data.error || t("admin.badgeAddFailed"), variant: "error" });
      }
    } catch (e) { console.error(e); }
  };

  const deleteBadge = async (id: number) => {
    if (!await confirm({ message: t("admin.badgeDeleteConfirm"), variant: "warning" })) return;
    try {
      const res = await fetch(`${apiUrl}/api/gamification/admin/badges/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchData();
    } catch (e) { console.error(e); }
  };

  if (loading) return <div className="flex flex-col items-center justify-center py-20 text-zinc-500 dark:text-zinc-400"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div><p className="font-medium">{t("common.loading") || "Đang tải..."}</p></div>;

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-4 text-purple-400">{t("admin.badgeCreateTitle")}</h3>
        <form onSubmit={addBadge} className="space-y-4">
          <div>
            <label className="block text-sm mb-1 text-zinc-500">{t("admin.badgeName")}</label>
            <input
              required
              value={newBadgeName}
              onChange={(e) => setNewBadgeName(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-md"
              placeholder={t("admin.badgeNamePlaceholder")}
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-zinc-500">{t("admin.badgeDesc")}</label>
            <textarea
              value={newBadgeDesc}
              onChange={(e) => setNewBadgeDesc(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-md min-h-[80px]"
              placeholder={t("admin.badgeDescPlaceholder")}
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-zinc-500">{t("admin.badgeIcon")}</label>
            <input
              value={newBadgeIcon}
              onChange={(e) => setNewBadgeIcon(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-md"
              placeholder="https://.../icon.png"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-zinc-900 dark:text-white rounded-md text-sm font-medium w-full">
            {t("admin.badgeBtnCreate")}
          </button>
        </form>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/30">
          <h3 className="font-semibold">{t("admin.badgeListTitle")}</h3>
        </div>
        <ul className="divide-y divide-border">
          {badges.length === 0 ? (
            <p className="p-4 text-zinc-500 text-sm">{t("admin.badgesEmpty")}</p>
          ) : (
            badges.map((badge) => (
              <li key={badge.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {badge.iconUrl ? (
                    <img src={badge.iconUrl} alt="badge" className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center font-bold">â˜…</div>
                  )}
                  <div>
                    <p className="font-medium">{badge.name}</p>
                    <p className="text-xs text-zinc-500">{badge.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => deleteBadge(badge.id)}
                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-md"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

