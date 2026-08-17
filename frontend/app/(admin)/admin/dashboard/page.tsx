"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Gamepad2, ShieldAlert, Server, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";
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
        const data = await fetchAPI('/admin/stats');
        // Adapt backend data to frontend stats format
        const fetchedStats = [
          { label: t("total_users") || "Total Users", value: data.totalUsers?.toString() || "0", trend: "+0", isPositive: true, icon: Users, color: "text-blue-500" },
          { label: t("active_games") || "Active Games", value: data.totalGames?.toString() || "0", trend: "+0", isPositive: true, icon: Gamepad2, color: "text-indigo-500" },
          { label: t("pending_moderation") || "Pending Moderation", value: data.pendingGames?.toString() || "0", trend: "0", isPositive: true, icon: ShieldAlert, color: "text-warning" },
          { label: t("server_load") || "Server Load", value: data.serverLoad || "Stable", trend: "", isPositive: true, icon: Server, color: "text-success" },
        ];
        setStats(fetchedStats);
      } catch (err) {
        console.error("Failed to load admin stats:", err);
        // Fallback to empty if unauthorized or missing
        setStats([
          { label: t("total_users") || "Total Users", value: "0", trend: "-", isPositive: true, icon: Users, color: "text-blue-500" },
          { label: t("active_games") || "Active Games", value: "0", trend: "-", isPositive: true, icon: Gamepad2, color: "text-indigo-500" },
          { label: t("pending_moderation") || "Pending Moderation", value: "0", trend: "-", isPositive: true, icon: ShieldAlert, color: "text-warning" },
          { label: t("server_load") || "Server Load", value: "N/A", trend: "-", isPositive: false, icon: Server, color: "text-error" },
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
            <Card key={idx} className="bg-surface/50 border-border">
              <CardContent className="p-6">
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
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Activity Feed */}
        <Card className="border-border bg-surface/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" /> Recent Activity
            </CardTitle>
            <CardDescription>Latest system and moderation events</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { time: "2 mins ago", msg: "User @neon_rider was reported for abusive language.", type: "warning" },
              { time: "15 mins ago", msg: "New game 'Cyber Strike' submitted for review.", type: "info" },
              { time: "1 hour ago", msg: "Automated backup completed successfully.", type: "success" },
              { time: "3 hours ago", msg: "Spike in server latency detected (Region: US-East).", type: "error" },
            ].map((event, i) => (
              <div key={i} className="flex gap-4 items-start p-3 rounded-xl bg-background border border-border">
                <div className="shrink-0 mt-0.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${
                    event.type === 'warning' ? 'bg-warning' :
                    event.type === 'info' ? 'bg-info' :
                    event.type === 'success' ? 'bg-success' : 'bg-error'
                  }`} />
                </div>
                <div>
                  <p className="text-sm text-foreground">{event.msg}</p>
                  <p className="text-xs text-muted-foreground mt-1">{event.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions / Moderation Queue Summary */}
        <Card className="border-border bg-surface/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-error" /> Moderation Queue
            </CardTitle>
            <CardDescription>Items requiring immediate admin action</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl border border-error/20 bg-error/5">
              <div>
                <p className="font-bold">Reported Games</p>
                <p className="text-sm text-muted-foreground">12 pending reviews</p>
              </div>
              <Badge variant="destructive">High Priority</Badge>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl border border-warning/20 bg-warning/5">
              <div>
                <p className="font-bold">User Reports</p>
                <p className="text-sm text-muted-foreground">28 pending reviews</p>
              </div>
              <Badge variant="outline" className="text-warning border-warning/50">Medium Priority</Badge>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-background">
              <div>
                <p className="font-bold">Creator Applications</p>
                <p className="text-sm text-muted-foreground">5 pending approvals</p>
              </div>
              <Badge variant="secondary">Low Priority</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
      
    </div>
  );
}
