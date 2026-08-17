"use client";

import { useState, useEffect } from "react";
import { CheckSquare, Gift, Zap, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const MOCK_QUESTS = [
  { id: "1", title: "Weekend Warrior", desc: "Play 5 different games this weekend.", progress: 3, total: 5, xp: 500, type: "Daily" },
  { id: "2", title: "Social Butterfly", desc: "Add 3 new friends.", progress: 3, total: 3, xp: 200, type: "Weekly", completed: true },
  { id: "3", title: "Reviewer", desc: "Leave a review on a game.", progress: 0, total: 1, xp: 150, type: "Daily" },
];

export default function QuestsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="flex flex-col space-y-10 pb-10 max-w-4xl mx-auto">
      
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-black tracking-tight">Quests & Rewards</h1>
        <p className="text-muted-foreground text-lg">Complete challenges to earn XP and level up your profile.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <Gift className="w-8 h-8 mb-4 text-white/80" />
            <h3 className="text-xl font-bold mb-1">Weekly Chest</h3>
            <p className="text-indigo-100 text-sm mb-4">Complete 5 daily quests to unlock.</p>
            <div className="w-full bg-black/20 rounded-full h-2 mb-2">
              <div className="bg-white h-2 rounded-full w-3/5" />
            </div>
            <p className="text-xs text-indigo-100 text-right">3/5 Quests</p>
          </CardContent>
        </Card>
        
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2 border-b border-border pb-2">
            <Zap className="w-5 h-5 text-warning" /> Active Quests
          </h2>
          
          <div className="space-y-4">
            {MOCK_QUESTS.map(quest => (
              <div key={quest.id} className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${quest.completed ? 'bg-success/10 border-success/30' : 'bg-surface border-border hover:border-primary/50'}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${quest.type === 'Daily' ? 'bg-blue-500/20 text-blue-500' : 'bg-purple-500/20 text-purple-500'}`}>
                      {quest.type}
                    </span>
                    <h3 className="font-bold text-foreground">{quest.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{quest.desc}</p>
                </div>
                
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="text-xs font-bold text-primary mb-1">+{quest.xp} XP</div>
                    {quest.completed ? (
                      <span className="text-sm font-bold text-success flex items-center"><CheckSquare className="w-4 h-4 mr-1" /> Completed</span>
                    ) : (
                      <span className="text-sm font-medium text-muted-foreground">{quest.progress} / {quest.total}</span>
                    )}
                  </div>
                  {!quest.completed && (
                    <Button variant="outline" size="sm">Play Now</Button>
                  )}
                  {quest.completed && (
                    <Button className="bg-success hover:bg-success/90 text-white" size="sm">Claim</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
