"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { useLanguage } from "../../../contexts/LanguageContext";

type SessionStat = {
  gameId: string;
  gameTitle: string;
  averageLength: number | null;
  totalSessions: number;
};

type CrashLog = {
  id: number;
  createdAt: string;
  errorMsg: string;
  browserInfo: string | null;
};

export default function AdminAnalyticsPage() {
  const { t } = useLanguage();
  const [sessionStats, setSessionStats] = useState<SessionStat[]>([]);
  const [crashLogs, setCrashLogs] = useState<CrashLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const token = Cookies.get("token");
      setLoading(true);
      try {
        const [r1, r2] = await Promise.all([
          fetch(`${apiUrl}/api/admin/analytics/sessions`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${apiUrl}/api/admin/analytics/crashes`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (r1.ok) { const d = await r1.json(); if (d.success) setSessionStats(d.data); }
        if (r2.ok) { const d = await r2.json(); if (d.success) setCrashLogs(d.data); }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex flex-col items-center justify-center py-20 text-zinc-500 dark:text-zinc-400"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div><p className="font-medium">{t("common.loading") || "Đang tải..."}</p></div>;

  return (
    <div className="space-y-8">
      <h3 className="text-lg font-semibold">{t("admin.analyticsTitle")}</h3>

      {/* Session Stats */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/30">
          <h4 className="font-semibold">{t("admin.analyticsAvgSession")}</h4>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/30 border-b border-border">
            <tr>
              <th className="p-4 font-medium text-zinc-600 dark:text-zinc-400">Game</th>
              <th className="p-4 font-medium text-zinc-600 dark:text-zinc-400">{t("admin.analyticsAvgSeconds")}</th>
              <th className="p-4 font-medium text-zinc-600 dark:text-zinc-400">{t("admin.analyticsTotalSessions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sessionStats.map((s, i) => (
              <tr key={i} className="hover:bg-muted/20">
                <td className="p-4 font-medium">{s.gameTitle || s.gameId}</td>
                <td className="p-4 text-zinc-600 dark:text-zinc-400">
                  {typeof s.averageLength === "number" ? s.averageLength.toFixed(1) : "-"}
                </td>
                <td className="p-4 text-zinc-600 dark:text-zinc-400">{s.totalSessions}</td>
              </tr>
            ))}
            {sessionStats.length === 0 && (
              <tr><td colSpan={3} className="p-8 text-center text-zinc-500">{t("admin.analyticsNoSessions")}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Crash Logs */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/30">
          <h4 className="font-semibold">{t("admin.analyticsCrashLogs")}</h4>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/30 border-b border-border">
            <tr>
              <th className="p-4 font-medium text-zinc-600 dark:text-zinc-400">{t("admin.analyticsTime")}</th>
              <th className="p-4 font-medium text-zinc-600 dark:text-zinc-400">{t("admin.analyticsError")}</th>
              <th className="p-4 font-medium text-zinc-600 dark:text-zinc-400">{t("admin.analyticsBrowser")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {crashLogs.map((c) => (
              <tr key={c.id} className="hover:bg-muted/20">
                <td className="p-4 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">{new Date(c.createdAt).toLocaleString()}</td>
                <td className="p-4 text-red-400 font-mono text-xs max-w-xs truncate">{c.errorMsg}</td>
                <td className="p-4 text-zinc-600 dark:text-zinc-400 text-xs">{c.browserInfo || "-"}</td>
              </tr>
            ))}
            {crashLogs.length === 0 && (
              <tr><td colSpan={3} className="p-8 text-center text-zinc-500">{t("admin.analyticsNoCrashes")}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

