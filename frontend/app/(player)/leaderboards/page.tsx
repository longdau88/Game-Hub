"use client";

import { useState, useEffect } from "react";
import { Trophy, Medal, Star } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

import { fetchAPI } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

export default function LeaderboardsPage() {
  const [mounted, setMounted] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    setMounted(true);
    Promise.all([
      fetchAPI('/leaderboards').catch(() => ({ data: [] })),
      fetchAPI('/auth/me').catch(() => ({}))
    ]).then(([lbRes, authRes]) => {
      setLeaderboard(lbRes.data || []);
      if (authRes.user) setUser(authRes.user);
    }).finally(() => setLoading(false));
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex flex-col space-y-10 pb-10 max-w-3xl mx-auto">
      
      <div className="text-center space-y-4 mb-4">
        <div className="inline-flex items-center justify-center p-4 bg-warning/10 rounded-full mb-2">
          <Trophy className="w-12 h-12 text-warning" />
        </div>
        <h1 className="text-4xl font-black tracking-tight">{t("global_leaderboards") || "Global Leaderboards"}</h1>
        <p className="text-muted-foreground text-lg">{t("leaderboards_subtitle") || "Top players across the entire GameHub platform."}</p>
      </div>

      <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-xl">
        <div className="bg-secondary/50 p-4 border-b border-border flex text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          <div className="w-16 text-center">{t("leaderboards.rank") || "Rank"}</div>
          <div className="flex-1 px-4">{t("leaderboards.player") || "Player"}</div>
          <div className="w-32 text-right">{t("leaderboards.score") || "Score (XP)"}</div>
        </div>
        
        <div className="flex flex-col divide-y divide-border">
          {loading ? (
             <div className="p-8 text-center text-muted-foreground">{t("loading") || "Loading..."}</div>
          ) : leaderboard.length > 0 ? (
            leaderboard.map((player: any, index: number) => {
              const rank = index + 1;
              return (
                <div key={player.id || index} className="flex items-center p-4 hover:bg-secondary/30 transition-colors">
                  <div className="w-16 flex justify-center">
                    {rank === 1 ? <Medal className="w-8 h-8 text-yellow-500" /> :
                     rank === 2 ? <Medal className="w-8 h-8 text-zinc-400" /> :
                     rank === 3 ? <Medal className="w-8 h-8 text-amber-600" /> :
                     <span className="text-xl font-bold text-muted-foreground">#{rank}</span>}
                  </div>
                  <div className="flex-1 flex items-center gap-4 px-4">
                    <Avatar src={player.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}`} fallback={player.name?.charAt(0) || "P"} className={rank <= 3 ? "w-12 h-12 border-2 border-primary" : ""} />
                    <span className={`text-lg font-bold ${rank <= 3 ? "text-foreground" : "text-muted-foreground"}`}>{player.name}</span>
                  </div>
                  <div className="w-32 text-right">
                    <span className="font-mono text-lg font-bold text-primary">{player.score?.toLocaleString() || 0}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center">
              <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground font-semibold text-lg">{t("not_available") || "Chưa có dữ liệu"}</p>
              <p className="text-sm text-muted-foreground/70 mt-2">{t("no_leaderboard") || "The leaderboard is currently empty."}</p>
            </div>
          )}
        </div>
        
        {user && (() => {
          const myRankIndex = leaderboard.findIndex(p => p.id === user.id);
          const myRank = myRankIndex >= 0 ? myRankIndex + 1 : '-';
          const myScore = myRankIndex >= 0 ? leaderboard[myRankIndex].score : (user.xp || 0);

          return (
            <div className="bg-primary/10 border-t border-primary/20 p-4 flex items-center">
              <div className="w-16 text-center text-lg font-bold text-primary">#{myRank}</div>
              <div className="flex-1 flex items-center gap-4 px-4">
                <Avatar src={user.avatarUrl} fallback={user.username?.[0]?.toUpperCase() || "U"} className="border-2 border-primary" />
                <span className="text-lg font-bold text-primary">{t("you") || "You"} ({user.username})</span>
              </div>
              <div className="w-32 text-right">
                <span className="font-mono text-lg font-bold text-primary">{myScore?.toLocaleString() || 0}</span>
              </div>
            </div>
          );
        })()}
      </div>

    </div>
  );
}
