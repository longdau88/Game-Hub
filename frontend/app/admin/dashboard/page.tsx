"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function AdminDashboardPage() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const token = Cookies.get("token");

  const formatBytes = (bytes: number) => {
    if (bytes === 0 || !bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${apiUrl}/api/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setStats(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="text-center py-12 text-zinc-500">Loading...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Link
        href="/admin/pending-games"
        className="bg-card border border-border rounded-xl p-6 shadow-sm cursor-pointer hover:border-primary transition-colors"
      >
        <h3 className="text-zinc-500 text-sm font-medium mb-2">{t("admin.statPending")}</h3>
        <p className="text-3xl font-bold text-yellow-500">{stats?.pendingGamesCount || 0}</p>
      </Link>
      <Link
        href="/admin/games"
        className="bg-card border border-border rounded-xl p-6 shadow-sm cursor-pointer hover:border-emerald-500 transition-colors"
      >
        <h3 className="text-zinc-500 text-sm font-medium mb-2">{t("admin.statPublished")}</h3>
        <p className="text-3xl font-bold text-emerald-500">{stats?.publishedGamesCount || 0}</p>
      </Link>
      <Link
        href="/admin/users"
        className="bg-card border border-border rounded-xl p-6 shadow-sm cursor-pointer hover:border-blue-500 transition-colors"
      >
        <h3 className="text-zinc-500 text-sm font-medium mb-2">{t("admin.statUsers")}</h3>
        <p className="text-3xl font-bold text-blue-500">{stats?.totalUsersCount || 0}</p>
      </Link>
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <h3 className="text-zinc-500 text-sm font-medium mb-2">{t("admin.statStorage")}</h3>
        <p className="text-3xl font-bold text-purple-500">{formatBytes(stats?.totalStorageBytes)}</p>
      </div>
    </div>
  );
}
