"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Users, DollarSign, MousePointerClick, ArrowUpRight, ArrowDownRight, MoreHorizontal, Settings, Play, Gamepad2 } from "lucide-react";
import Link from "next/link";
import { fetchAPI } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

export default function CreatorDashboard() {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<any[]>([]);
  const [recentGames, setRecentGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    setMounted(true);
    const loadData = async () => {
      try {
        const gamesRes = await fetchAPI('/games/creator/games');
        const gamesData = gamesRes.data || [];
        
        // Calculate stats
        const totalPlays = gamesData.reduce((acc: number, g: any) => acc + (g.playCount || 0), 0);
        
        setStats([
          { label: t("total_plays") || "Total Plays", value: totalPlays.toString(), trend: "+0%", isPositive: true, icon: MousePointerClick, color: "text-blue-500" },
          { label: t("total_games") || "Total Games", value: gamesData.length.toString(), trend: "+0%", isPositive: true, icon: Gamepad2, color: "text-indigo-500" },
          { label: t("estimated_revenue") || "Estimated Revenue", value: "$0", trend: "0%", isPositive: true, icon: DollarSign, color: "text-emerald-500" },
          { label: t("avg_rating") || "Average Rating", value: "0.0", trend: "0", isPositive: false, icon: BarChart3, color: "text-amber-500" },
        ]);
        
        setRecentGames(gamesData.slice(0, 3).map((g: any) => ({
          id: g.id,
          title: g.title,
          status: g.isPublished ? "Published" : "In Review",
          plays: g.playCount?.toString() || "0",
          revenue: "$0",
          rating: g.averageRating?.toString() || "0.0"
        })));
        
      } catch (err) {
        console.error("Failed to load creator data:", err);
        setStats([
          { label: t("total_plays") || "Total Plays", value: "0", trend: "0%", isPositive: true, icon: MousePointerClick, color: "text-blue-500" },
          { label: t("total_games") || "Total Games", value: "0", trend: "0%", isPositive: true, icon: Gamepad2, color: "text-indigo-500" },
          { label: t("estimated_revenue") || "Estimated Revenue", value: "$0", trend: "0%", isPositive: true, icon: DollarSign, color: "text-emerald-500" },
          { label: t("avg_rating") || "Average Rating", value: "0.0", trend: "0", isPositive: false, icon: BarChart3, color: "text-amber-500" },
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [t]);

  if (!mounted) return null;

  return (
    <div className="space-y-8 pb-10">
      
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("studio_overview") || "Studio Overview"}</h1>
          <p className="text-muted-foreground mt-1">{t("studio_overview_desc") || "Here's what's happening with your games today."}</p>
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

      {/* Two Column Layout for Charts and Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Chart Area (Mocked visually) */}
        <Card className="lg:col-span-2 border-border bg-surface/30">
          <CardHeader>
            <CardTitle>Revenue & Plays (Last 30 Days)</CardTitle>
            <CardDescription>Performance metrics across all your published games.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full flex items-center justify-center pt-4 px-2">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground font-semibold">{t("not_available") || "Chưa có dữ liệu"}</p>
                <p className="text-sm text-muted-foreground/70">{t("no_chart_data") || "Not enough data to display chart."}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Games List */}
        <Card className="border-border bg-surface/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle>Recent Games</CardTitle>
              <CardDescription>Status of your latest uploads</CardDescription>
            </div>
            <Link href="/creator/games">
              <Button variant="ghost" size="sm" className="text-muted-foreground text-xs">View All</Button>
            </Link>
          </CardHeader>
          <CardContent className="grid gap-4 mt-4">
            {recentGames.map((game: any) => (
              <div key={game.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary transition-colors border border-transparent hover:border-border">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Gamepad2 className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{game.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant={game.status === "Published" ? "success" : "warning"} className="text-[10px] px-1.5 py-0">
                        {game.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground truncate">{game.plays} plays</span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8">
                  <Settings className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            ))}
            
            <Link href="/creator/games/new" className="mt-2 block">
              <Button variant="outline" className="w-full border-dashed border-2 bg-transparent hover:bg-secondary">
                Upload New Game
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      
    </div>
  );
}
