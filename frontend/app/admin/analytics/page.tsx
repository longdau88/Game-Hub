"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { Activity, Clock3, Gamepad2, Users } from "lucide-react";
import { useLanguage } from "../../../contexts/LanguageContext";

type TrendPoint = { date: string; sessions: number; uniquePlayers: number; crashes: number };
type GameOption = { id: string; title: string };
type TopGame = {
  gameId: string; gameTitle: string; sessions: number; uniquePlayers: number;
  averageSessionLength: number; crashRate: number; averageRating: number;
  totalRatings: number; favorites: number; playCount: number;
};
type AnalyticsData = {
  summary: { sessions: number; uniquePlayers: number; totalDuration: number; approvedGames: number; crashes: number; crashRate: number };
  trend: TrendPoint[]; topGames: TopGame[]; retention: Record<string, number>; games: GameOption[];
};

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours ? `${hours} giờ ${minutes} phút` : `${minutes} phút`;
};

function TrendChart({ trend }: { trend: TrendPoint[] }) {
  const max = Math.max(1, ...trend.flatMap(point => [point.sessions, point.uniquePlayers]));
  const width = 760;
  const height = 260;
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const x = (index: number) => padding.left + (index * (width - padding.left - padding.right)) / Math.max(1, trend.length - 1);
  const y = (value: number) => height - padding.bottom - (value * (height - padding.top - padding.bottom)) / max;
  const path = (key: "sessions" | "uniquePlayers") => trend.map((point, index) => `${index ? "L" : "M"}${x(index)},${y(point[key])}`).join(" ");
  const { t } = useLanguage();

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center gap-4 text-xs text-zinc-500 mb-3">
        <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-primary" /> Sessions</span>
        <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-emerald-500" /> Người chơi</span>
      </div>
      {trend.every(point => point.sessions === 0 && point.uniquePlayers === 0) ? (
        <p className="py-16 text-center text-sm text-zinc-500">{t("admin.analytics.noDataSelected") || "Chưa có dữ liệu trong khoảng thời gian đã chọn."}</p>
      ) : (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label="Biểu đồ xu hướng sessions và người chơi">
          {[0, 0.5, 1].map(level => <line key={level} x1={padding.left} x2={width - padding.right} y1={y(max * level)} y2={y(max * level)} className="stroke-border" strokeWidth="1" />)}
          <text x="4" y={padding.top + 4} className="fill-zinc-500 text-[11px]">{max}</text>
          <text x="10" y={height - padding.bottom + 4} className="fill-zinc-500 text-[11px]">0</text>
          <path d={path("sessions")} fill="none" className="stroke-primary" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d={path("uniquePlayers")} fill="none" className="stroke-emerald-500" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {trend.map((point, index) => (
            <g key={point.date}>
              <circle cx={x(index)} cy={y(point.sessions)} r="3" className="fill-primary" />
              <circle cx={x(index)} cy={y(point.uniquePlayers)} r="3" className="fill-emerald-500" />
              {(trend.length <= 14 || index % Math.ceil(trend.length / 7) === 0 || index === trend.length - 1) && <text x={x(index)} y={height - 13} textAnchor="middle" className="fill-zinc-500 text-[10px]">{new Date(`${point.date}T00:00:00`).toLocaleDateString(undefined, { day: "2-digit", month: "2-digit" })}</text>}
            </g>
          ))}
        </svg>
      )}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const { t } = useLanguage();
  const [range, setRange] = useState("30d");
  const [gameId, setGameId] = useState("");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        const params = new URLSearchParams({ range });
        if (gameId) params.set("gameId", gameId);
        const response = await fetch(`${apiUrl}/api/admin/analytics/overview?${params}`, { headers: { Authorization: `Bearer ${Cookies.get("token")}` }, signal: controller.signal });
        const result = await response.json();
        if (response.ok && result.success) setData(result.data);
      } catch (error) {
        if ((error as Error).name !== "AbortError") console.error(error);
      } finally { if (!controller.signal.aborted) setLoading(false); }
    };
    load();
    return () => controller.abort();
  }, [range, gameId]);

  if (loading && !data) return <div className="flex flex-col items-center justify-center py-20 text-zinc-500"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" /><p className="font-medium">{t("common.loading")}</p></div>;
  if (!data) return <p className="py-20 text-center text-zinc-500">{t("admin.analytics.loadError") || "Không thể tải dữ liệu thống kê."}</p>;

  const cards = [
    { label: "Sessions", value: data.summary.sessions.toLocaleString(), icon: Activity, color: "text-primary" },
    { label: "Người chơi duy nhất", value: data.summary.uniquePlayers.toLocaleString(), icon: Users, color: "text-emerald-500" },
    { label: "Tổng thời gian chơi", value: formatDuration(data.summary.totalDuration), icon: Clock3, color: "text-violet-500" },
    { label: "Game mới được duyệt", value: data.summary.approvedGames.toLocaleString(), icon: Gamepad2, color: "text-amber-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><h3 className="text-lg font-semibold">{t("admin.analyticsTitle")}</h3><p className="text-sm text-zinc-500 mt-1">{t("admin.analytics.subtitle") || "Hiệu suất game và chất lượng trải nghiệm."}</p></div>
        <div className="flex flex-wrap gap-2">
          <select aria-label="Khoảng thời gian" value={range} onChange={event => setRange(event.target.value)} className="h-10 rounded-lg border border-border bg-card px-3 text-sm">
            <option value="7d">{t("admin.analytics.time7d") || "7 ngày qua"}</option><option value="30d">{t("admin.analytics.time30d") || "30 ngày qua"}</option><option value="90d">{t("admin.analytics.time90d") || "90 ngày qua"}</option>
          </select>
          <select aria-label="Game" value={gameId} onChange={event => setGameId(event.target.value)} className="h-10 max-w-52 rounded-lg border border-border bg-card px-3 text-sm">
            <option value="">{t("admin.analytics.allGames") || "Tất cả game"}</option>{data.games.map(game => <option key={game.id} value={game.id}>{game.title}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(card => { const Icon = card.icon; return <div key={card.label} className="bg-card border border-border rounded-xl p-5"><div className="flex items-center justify-between"><p className="text-sm text-zinc-500">{card.label}</p><Icon className={`w-5 h-5 ${card.color}`} /></div><p className="mt-3 text-2xl font-bold">{card.value}</p></div>; })}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden"><div className="p-4 border-b border-border"><h4 className="font-semibold">{t("admin.analytics.trendTitle") || "Xu hướng sessions & người chơi"}</h4></div><TrendChart trend={data.trend} /></div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="bg-card border border-border rounded-xl overflow-hidden xl:col-span-2"><div className="p-4 border-b border-border"><h4 className="font-semibold">{t("admin.analytics.topGamesTitle") || "Top game theo lượt chơi"}</h4></div><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-muted/30 border-b border-border"><tr><th className="p-4 font-medium">{t("admin.analytics.colGame") || "Game"}</th><th className="p-4 font-medium">{t("admin.analytics.colSessions") || "Sessions"}</th><th className="p-4 font-medium">{t("admin.analytics.colPlayers") || "Người chơi"}</th><th className="p-4 font-medium">{t("admin.analytics.colAvgSession") || "TB chơi"}</th><th className="p-4 font-medium">{t("admin.analytics.colRating") || "Đánh giá"}</th><th className="p-4 font-medium">{t("admin.analytics.colFavorites") || "Yêu thích"}</th></tr></thead><tbody className="divide-y divide-border">{data.topGames.map(game => <tr key={game.gameId} className="hover:bg-muted/20"><td className="p-4 font-medium">{game.gameTitle}</td><td className="p-4">{game.sessions}</td><td className="p-4">{game.uniquePlayers}</td><td className="p-4">{game.averageSessionLength.toFixed(1)} s</td><td className="p-4">{game.totalRatings ? `${game.averageRating.toFixed(1)} / 5 (${game.totalRatings})` : "-"}</td><td className="p-4">{game.favorites}</td></tr>)}{data.topGames.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-zinc-500">{t("admin.analytics.noDataSelected") || "Chưa có game phù hợp."}</td></tr>}</tbody></table></div></div>
        <div className="space-y-6"><div className="bg-card border border-border rounded-xl p-5"><h4 className="font-semibold">{t("admin.analytics.qualityTitle") || "Chất lượng game"}</h4><div className="mt-5 space-y-4"><div><p className="text-sm text-zinc-500">{t("admin.analytics.crashRate") || "Crash rate"}</p><p className={`mt-1 text-3xl font-bold ${data.summary.crashRate > 5 ? "text-red-500" : "text-emerald-500"}`}>{data.summary.crashRate}%</p><p className="mt-1 text-xs text-zinc-500">{t("admin.analytics.crashDetail")?.replace("{crashes}", data.summary.crashes.toString()).replace("{sessions}", data.summary.sessions.toString()) || `${data.summary.crashes} lỗi trên ${data.summary.sessions} sessions`}</p></div><div className="border-t border-border pt-4"><p className="text-sm text-zinc-500">{t("admin.analytics.retention") || "Retention"}</p><div className="mt-2 grid grid-cols-3 gap-2 text-center"><div><p className="font-semibold">{data.retention.d1}%</p><p className="text-xs text-zinc-500">D1</p></div><div><p className="font-semibold">{data.retention.d7}%</p><p className="text-xs text-zinc-500">D7</p></div><div><p className="font-semibold">{data.retention.d30}%</p><p className="text-xs text-zinc-500">D30</p></div></div></div></div></div><div className="bg-card border border-border rounded-xl p-5"><h4 className="font-semibold">{t("admin.analytics.crashByGame") || "Crash theo game"}</h4><div className="mt-4 space-y-3">{data.topGames.slice(0, 5).map(game => <div key={game.gameId}><div className="flex justify-between gap-3 text-sm"><span className="truncate">{game.gameTitle}</span><span className="font-medium">{game.crashRate.toFixed(1)}%</span></div><div className="mt-1 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-red-500" style={{ width: `${Math.min(game.crashRate, 100)}%` }} /></div></div>)}{data.topGames.length === 0 && <p className="text-sm text-zinc-500">{t("admin.analytics.noDataSelected") || "Chưa có dữ liệu."}</p>}</div></div></div>
      </div>
    </div>
  );
}
