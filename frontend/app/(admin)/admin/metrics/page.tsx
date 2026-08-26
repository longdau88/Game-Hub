"use client";

import { useState, useEffect } from "react";
import { fetchAPI } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Activity, Users, Clock, AlertTriangle, UserPlus, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function MetricsPage() {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [dateRange, setDateRange] = useState("30d");
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const loadMetrics = async () => {
      setLoading(true);
      try {
        const res = await fetchAPI(`/admin/analytics/overview?range=${dateRange}`);
        if (res?.data) {
          setMetrics(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadMetrics();
  }, [dateRange]);

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("admin.metrics") || "Metrics & Analytics"}</h1>
          <p className="text-muted-foreground">{t("admin.metricsDesc") || "Monitor player activity and game performance."}</p>
        </div>
        <select 
          value={dateRange} 
          onChange={e => setDateRange(e.target.value)}
          className="bg-surface border border-border text-foreground text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5"
        >
          <option value="1d">{t("admin.last1Day") || "Last 24 Hours"}</option>
          <option value="7d">{t("admin.last7Days") || "Last 7 Days"}</option>
          <option value="30d">{t("admin.last30Days") || "Last 30 Days"}</option>
          <option value="90d">{t("admin.last90Days") || "Last 90 Days"}</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      ) : metrics ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="bg-surface border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t("admin.newUsers") || "New Users"}</CardTitle>
                <UserPlus className="h-4 w-4 text-pink-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{metrics.summary.newUsers?.toLocaleString() || 0}</div>
                {metrics.summary.newUsersGrowth !== undefined && (
                  <div className={`text-xs mt-1 flex items-center font-medium ${metrics.summary.newUsersGrowth >= 0 ? 'text-success' : 'text-error'}`}>
                    {metrics.summary.newUsersGrowth >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                    {Math.abs(metrics.summary.newUsersGrowth)}%
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="bg-surface border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t("admin.totalSessions") || "Total Sessions"}</CardTitle>
                <Activity className="h-4 w-4 text-indigo-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{metrics.summary.sessions?.toLocaleString() || 0}</div>
                {metrics.summary.sessionsGrowth !== undefined && (
                  <div className={`text-xs mt-1 flex items-center font-medium ${metrics.summary.sessionsGrowth >= 0 ? 'text-success' : 'text-error'}`}>
                    {metrics.summary.sessionsGrowth >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                    {Math.abs(metrics.summary.sessionsGrowth)}%
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="bg-surface border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t("admin.uniquePlayers") || "Unique Players"}</CardTitle>
                <Users className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{metrics.summary.uniquePlayers?.toLocaleString() || 0}</div>
                {metrics.summary.playersGrowth !== undefined && (
                  <div className={`text-xs mt-1 flex items-center font-medium ${metrics.summary.playersGrowth >= 0 ? 'text-success' : 'text-error'}`}>
                    {metrics.summary.playersGrowth >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                    {Math.abs(metrics.summary.playersGrowth)}%
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="bg-surface border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t("admin.playTime") || "Total Play Time"}</CardTitle>
                <Clock className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{Math.round((metrics.summary.totalDuration || 0) / 3600).toLocaleString()} h</div>
                {metrics.summary.durationGrowth !== undefined && (
                  <div className={`text-xs mt-1 flex items-center font-medium ${metrics.summary.durationGrowth >= 0 ? 'text-success' : 'text-error'}`}>
                    {metrics.summary.durationGrowth >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                    {Math.abs(metrics.summary.durationGrowth)}%
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="bg-surface border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t("admin.crashRate") || "Crash Rate"}</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{metrics.summary.crashRate}%</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Trends Chart */}
            <Card className="col-span-1 lg:col-span-2 bg-surface border-border">
              <CardHeader>
                <CardTitle className="text-foreground">{t("admin.activityTrend") || "Activity Trend"}</CardTitle>
                <CardDescription>{t("admin.sessions") || "Sessions"} & {t("admin.players") || "Players"}</CardDescription>
              </CardHeader>
              <CardContent className="h-80 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics.trend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
                    <XAxis dataKey="date" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5', borderRadius: '8px' }}
                    />
                    <Line type="monotone" name={t("admin.sessions") || "Sessions"} dataKey="sessions" stroke="#6366f1" strokeWidth={3} dot={false} />
                    <Line type="monotone" name={t("admin.players") || "Players"} dataKey="uniquePlayers" stroke="#10b981" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Retention */}
            <Card className="col-span-1 bg-surface border-border">
              <CardHeader>
                <CardTitle className="text-foreground">{t("admin.retention") || "Player Retention"}</CardTitle>
                <CardDescription>{t("admin.retentionRates") || "D1, D7, D30 Return Rates"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">{t("admin.d1Retention") || "D1 Retention"}</span>
                    <span className="font-bold text-indigo-500">{metrics.retention.d1 || 0}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${metrics.retention.d1 || 0}%` }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">{t("admin.d7Retention") || "D7 Retention"}</span>
                    <span className="font-bold text-emerald-500">{metrics.retention.d7 || 0}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${metrics.retention.d7 || 0}%` }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">{t("admin.d30Retention") || "D30 Retention"}</span>
                    <span className="font-bold text-amber-500">{metrics.retention.d30 || 0}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${metrics.retention.d30 || 0}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Games Chart */}
          <Card className="bg-surface border-border">
            <CardHeader>
              <CardTitle className="text-foreground">{t("admin.topGamesBySessions") || "Top Games by Sessions"}</CardTitle>
            </CardHeader>
            <CardContent className="h-80 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.topGames.slice(0, 5)} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" horizontal={false} />
                  <XAxis type="number" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis dataKey="gameTitle" type="category" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} width={150} />
                  <RechartsTooltip 
                    cursor={{fill: '#27272a'}}
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5', borderRadius: '8px' }}
                  />
                  <Bar name={t("admin.sessions") || "Sessions"} dataKey="sessions" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
