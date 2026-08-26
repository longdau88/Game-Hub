"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Gamepad2, ShieldAlert, Server, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { fetchAPI } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    setMounted(true);
    const loadStats = async () => {
      try {
        const data = await fetchAPI('/admin/stats', { cache: 'no-store' });
        // Adapt backend data to frontend stats format
        const fetchedStats = [
          { label: t("total_users") || "Total Users", value: data.totalUsersCount?.toString() || "0", trend: data.trends?.users || "+0", isPositive: true, icon: Users, color: "text-blue-500", href: "/admin/users" },
          { label: t("active_games") || "Active Games", value: data.publishedGamesCount?.toString() || "0", trend: data.trends?.games || "+0", isPositive: true, icon: Gamepad2, color: "text-indigo-500", href: "/admin/games" },
          { label: t("pending_moderation") || "Pending Moderation", value: data.pendingGamesCount?.toString() || "0", trend: data.trends?.pending || "+0", isPositive: true, icon: ShieldAlert, color: "text-warning", href: "/admin/moderation" },
          { label: t("storage_used") || "Storage Used", value: data.totalStorageBytes ? (data.totalStorageBytes / (1024*1024*1024)).toFixed(2) + " GB" : "0 GB", trend: "", isPositive: true, icon: Server, color: "text-success", href: "/admin/infrastructure" },
        ];
        setStats(fetchedStats);
      } catch (err) {
        console.error("Failed to load admin stats:", err);
        // Fallback to empty if unauthorized or missing
        setStats([
          { label: t("total_users") || "Total Users", value: "0", trend: "0%", isPositive: true, icon: Users, color: "text-blue-500", href: "/admin/users" },
          { label: t("active_games") || "Active Games", value: "0", trend: "0%", isPositive: true, icon: Gamepad2, color: "text-indigo-500", href: "/admin/games" },
          { label: t("pending_moderation") || "Pending Moderation", value: "0", trend: "0", isPositive: true, icon: ShieldAlert, color: "text-warning", href: "/admin/moderation" },
          { label: t("server_load") || "Server Load", value: "N/A", trend: "0%", isPositive: false, icon: Server, color: "text-error", href: "/admin/infrastructure" },
        ]);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [t]);

  if (!mounted) return null;

  return (
    <div className="space-y-8 pb-10">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("system_overview") || "System Overview"}</h1>
          <p className="text-muted-foreground mt-1">{t("system_overview_desc") || "Real-time metrics and platform health."}</p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {loading ? (
          <div className="col-span-full py-10 text-center text-muted-foreground">{t("loading") || "Loading..."}</div>
        ) : (
          stats.map((stat, idx) => (
            <Link key={idx} href={stat.href} className="block transition-transform hover:scale-[1.02]">
              <Card className="bg-surface/50 border-border hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-6 h-full flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-surface border border-border ${stat.color} bg-opacity-10`}>
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <div className={`flex items-center text-sm font-medium ${stat.isPositive ? 'text-success' : 'text-error'}`}>
                      {stat.isPositive ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
                      {stat.trend}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <h3 className="text-3xl font-black mt-1">{stat.value}</h3>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Activity Feed */}
        <Card className="border-border bg-surface/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" /> {t("admin.recentActivity") || "Recent Activity"}
            </CardTitle>
            <CardDescription>{t("admin.recentActivityDesc") || "Latest system and moderation events"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="text-center py-6">
              <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground font-semibold">{t("not_available") || "Chưa có dữ liệu"}</p>
              <p className="text-sm text-muted-foreground/70">{t("no_recent_activity") || "No recent activity recorded."}</p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions / Moderation Queue Summary */}
        <Card className="border-border bg-surface/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-error" /> {t("admin.moderationQueue") || "Moderation Queue"}
            </CardTitle>
            <CardDescription>{t("admin.moderationQueueDesc") || "Items requiring immediate admin action"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="text-center py-6">
              <ShieldAlert className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground font-semibold">{t("not_available") || "Chưa có dữ liệu"}</p>
              <p className="text-sm text-muted-foreground/70">{t("no_moderation_queue") || "Moderation queue is empty."}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
    </div>
  );
}
