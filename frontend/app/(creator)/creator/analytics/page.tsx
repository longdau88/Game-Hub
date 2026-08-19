"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart as LineChartIcon, Activity, MousePointerClick, Gamepad2, ArrowUpRight, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchAPI } from "@/lib/api";

export default function AnalyticsPage() {
  const searchParams = useSearchParams();
  const initialGameId = searchParams?.get("gameId") || "all";
  const [mounted, setMounted] = useState(false);
  const [games, setGames] = useState<any[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>(initialGameId);
  const [stats, setStats] = useState<any>({
    totalPlays: 0,
    activePlayers: 0,
    totalGames: 0,
    performanceData: [],
  });
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  // 1. Fetch the list of games for the dropdown
  useEffect(() => {
    setMounted(true);
    fetchAPI('/games/creator/games')
      .then(res => {
        if (res.data) setGames(res.data);
      })
      .catch(() => {});
  }, []);

  // 2. Fetch the analytics data whenever selectedGameId changes
  useEffect(() => {
    setLoading(true);
    let url = '/games/creator/analytics';
    if (selectedGameId !== "all") {
      url += `?gameId=${selectedGameId}`;
    }
    fetchAPI(url)
      .then(res => {
        if (res.data) {
          setStats(res.data);
        }
      })
      .catch((err) => {
        console.error("Failed to load analytics", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedGameId]);

  if (!mounted) return null;

  return (
    <div className="space-y-8 pb-10">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("admin.tabAnalytics") || "Analytics"}</h1>
          <p className="text-muted-foreground mt-1">{t("creator.analyticsDesc") || "Deep dive into your games' performance metrics."}</p>
        </div>
        <div>
          <select 
            value={selectedGameId} 
            onChange={(e) => setSelectedGameId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="all">{t("creator.allGames") || "All Games"}</option>
            {games.map(g => (
              <option key={g.id} value={g.id}>{g.title}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-surface/50 border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
                <MousePointerClick className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t("total_plays") || "Total Plays"}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h3 className="text-2xl font-black">{loading ? "..." : stats.totalPlays}</h3>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface/50 border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t("creator.activePlayers") || "Active Players"}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h3 className="text-2xl font-black">{loading ? "..." : stats.activePlayers}</h3>
                  <span className="text-xs text-muted-foreground flex items-center">Live</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface/50 border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500">
                <Gamepad2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t("total_games") || "Total Games"}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h3 className="text-2xl font-black">{loading ? "..." : stats.totalGames}</h3>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="border-border bg-surface/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              {t("creator.playTrends") || "Play Trends (7 Days)"}
            </CardTitle>
            <CardDescription>{t("creator.playTrendsDesc") || "Daily play count across your portfolio"}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
               <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
                 {t("loading") || "Loading..."}
               </div>
            ) : stats.performanceData.length === 0 || stats.performanceData.every((d: any) => d.plays === 0) ? (
               <div className="h-[300px] w-full flex flex-col items-center justify-center text-muted-foreground">
                 <LineChartIcon className="w-12 h-12 mb-4 opacity-20" />
                 <p>{t("not_available") || "Chưa có dữ liệu"}</p>
               </div>
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" tick={{fill: 'rgba(255,255,255,0.5)'}} />
                    <YAxis stroke="rgba(255,255,255,0.5)" tick={{fill: 'rgba(255,255,255,0.5)'}} allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(17,24,39,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Line type="monotone" dataKey="plays" name={t("total_plays") || "Plays"} stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: "#6366f1", strokeWidth: 2, stroke: "#1e1b4b" }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
