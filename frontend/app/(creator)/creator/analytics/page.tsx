"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3, LineChart as LineChartIcon, Activity, MousePointerClick, Gamepad2, ArrowUpRight, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchAPI } from "@/lib/api";

const mockPerformanceData = [
  { name: 'Mon', plays: 120, revenue: 4.5 },
  { name: 'Tue', plays: 150, revenue: 5.2 },
  { name: 'Wed', plays: 180, revenue: 6.8 },
  { name: 'Thu', plays: 130, revenue: 4.1 },
  { name: 'Fri', plays: 210, revenue: 8.5 },
  { name: 'Sat', plays: 320, revenue: 14.2 },
  { name: 'Sun', plays: 280, revenue: 11.5 },
];

const mockDeviceData = [
  { name: 'Desktop', value: 65 },
  { name: 'Mobile', value: 30 },
  { name: 'Tablet', value: 5 },
];

export default function AnalyticsPage() {
  const [mounted, setMounted] = useState(false);
  const [games, setGames] = useState<any[]>([]);
  const { t } = useLanguage();

  useEffect(() => {
    setMounted(true);
    fetchAPI('/games/creator/games')
      .then(res => {
        if (res.data) setGames(res.data);
      })
      .catch(() => {});
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-8 pb-10">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("admin.tabAnalytics") || "Analytics"}</h1>
          <p className="text-muted-foreground mt-1">{t("creator.analyticsDesc") || "Deep dive into your games' performance metrics."}</p>
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
                  <h3 className="text-2xl font-black">{games.reduce((acc, g) => acc + (g.playCount || 0), 0)}</h3>
                  <span className="text-xs text-success flex items-center"><ArrowUpRight className="w-3 h-3" /> 12%</span>
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
                  <h3 className="text-2xl font-black">0</h3>
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
                  <h3 className="text-2xl font-black">{games.length}</h3>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border bg-surface/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              {t("creator.playTrends") || "Play Trends (7 Days)"}
            </CardTitle>
            <CardDescription>{t("creator.playTrendsDesc") || "Daily play count across your portfolio"}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" tick={{fill: 'rgba(255,255,255,0.5)'}} />
                  <YAxis stroke="rgba(255,255,255,0.5)" tick={{fill: 'rgba(255,255,255,0.5)'}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(17,24,39,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="plays" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: "#6366f1", strokeWidth: 2, stroke: "#1e1b4b" }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-surface/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-500" />
              {t("creator.revenueMetrics") || "Revenue Metrics"}
            </CardTitle>
            <CardDescription>{t("creator.revenueDesc") || "Estimated ad revenue and tips"}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" tick={{fill: 'rgba(255,255,255,0.5)'}} />
                  <YAxis stroke="rgba(255,255,255,0.5)" tick={{fill: 'rgba(255,255,255,0.5)'}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(17,24,39,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  />
                  <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
