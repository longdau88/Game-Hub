"use client";

import { useState, useEffect } from "react";
import { Trophy, Medal, Star } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

const MOCK_LEADERBOARD = [
  { rank: 1, name: "NeonRider", score: 98450, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=1" },
  { rank: 2, name: "ProGamer99", score: 87200, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=2" },
  { rank: 3, name: "ShadowNinja", score: 76500, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=3" },
  { rank: 4, name: "PixelKing", score: 65400, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=4" },
  { rank: 5, name: "AlexChen", score: 54300, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=5" },
];

export default function LeaderboardsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="flex flex-col space-y-10 pb-10 max-w-3xl mx-auto">
      
      <div className="text-center space-y-4 mb-4">
        <div className="inline-flex items-center justify-center p-4 bg-warning/10 rounded-full mb-2">
          <Trophy className="w-12 h-12 text-warning" />
        </div>
        <h1 className="text-4xl font-black tracking-tight">Global Leaderboards</h1>
        <p className="text-muted-foreground text-lg">Top players across the entire GameHub platform.</p>
      </div>

      <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-xl">
        <div className="bg-secondary/50 p-4 border-b border-border flex text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          <div className="w-16 text-center">Rank</div>
          <div className="flex-1 px-4">Player</div>
          <div className="w-32 text-right">Score (XP)</div>
        </div>
        
        <div className="flex flex-col divide-y divide-border">
          {MOCK_LEADERBOARD.map((player) => (
            <div key={player.rank} className="flex items-center p-4 hover:bg-secondary/30 transition-colors">
              <div className="w-16 flex justify-center">
                {player.rank === 1 ? <Medal className="w-8 h-8 text-yellow-500" /> :
                 player.rank === 2 ? <Medal className="w-8 h-8 text-zinc-400" /> :
                 player.rank === 3 ? <Medal className="w-8 h-8 text-amber-600" /> :
                 <span className="text-xl font-bold text-muted-foreground">#{player.rank}</span>}
              </div>
              <div className="flex-1 flex items-center gap-4 px-4">
                <Avatar src={player.avatar} fallback={player.name.charAt(0)} className={player.rank <= 3 ? "w-12 h-12 border-2 border-primary" : ""} />
                <span className={`text-lg font-bold ${player.rank <= 3 ? "text-foreground" : "text-muted-foreground"}`}>{player.name}</span>
              </div>
              <div className="w-32 text-right">
                <span className="font-mono text-lg font-bold text-primary">{player.score.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
        
        {/* Current User Rank */}
        <div className="bg-primary/10 border-t border-primary/20 p-4 flex items-center">
          <div className="w-16 text-center text-lg font-bold text-primary">#42</div>
          <div className="flex-1 flex items-center gap-4 px-4">
            <Avatar fallback="Y" className="border-2 border-primary" />
            <span className="text-lg font-bold text-primary">You (John Doe)</span>
          </div>
          <div className="w-32 text-right">
            <span className="font-mono text-lg font-bold text-primary">12,450</span>
          </div>
        </div>
      </div>

    </div>
  );
}
