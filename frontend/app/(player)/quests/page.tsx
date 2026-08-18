"use client";

import { useState, useEffect } from "react";
import { CheckSquare, Gift, Zap, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { fetchAPI } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

export default function QuestsPage() {
  const [mounted, setMounted] = useState(false);
  const [quests, setQuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    setMounted(true);
    fetchAPI('/gamification/quests/daily')
      .then(res => {
         const data = Array.isArray(res) ? res : (res.data || []);
         setQuests(data.map((q: any) => ({
           id: q.id,
           type: 'Daily',
           title: q.title,
           desc: q.description || '',
           xp: q.rewardXp,
           completed: q.progress?.isCompleted || false,
           progress: q.progress?.currentVal || 0,
           total: q.targetValue
         })));
      })
      .catch(() => setQuests([]))
      .finally(() => setLoading(false));
  }, []);

  const handleClaim = async (questId: number) => {
    try {
      const res = await fetchAPI('/gamification/quests/claim', {
        method: 'POST',
        body: JSON.stringify({ questId })
      });
      if (!res.error) {
        setQuests(quests.map(q => q.id === questId ? { ...q, completed: true, progress: q.total } : q));
      }
    } catch (e) {
      console.error(e);
    }
  };
  
  if (!mounted) return null;

  return (
    <div className="flex flex-col space-y-10 pb-10 max-w-4xl mx-auto">
      
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-black tracking-tight">{t("quests_rewards") || "Quests & Rewards"}</h1>
        <p className="text-muted-foreground text-lg">{t("quests_subtitle") || "Complete challenges to earn XP and level up your profile."}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <Gift className="w-8 h-8 mb-4 text-white/80" />
            <h3 className="text-xl font-bold mb-1">{t("quests.weekly_chest") || "Weekly Chest"}</h3>
            <p className="text-indigo-100 text-sm mb-4">{t("quests.weekly_chest_desc") || "Complete 5 daily quests to unlock."}</p>
            <div className="w-full bg-black/20 rounded-full h-2 mb-2">
              <div className="bg-white h-2 rounded-full w-3/5" />
            </div>
            <p className="text-xs text-indigo-100 text-right">3/5 {t("quests.quests_count") || "Quests"}</p>
          </CardContent>
        </Card>
        
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2 border-b border-border pb-2">
            <Zap className="w-5 h-5 text-warning" /> {t("active_quests") || "Active Quests"}
          </h2>
          
          <div className="space-y-4">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">{t("loading") || "Loading..."}</div>
            ) : quests.length > 0 ? (
              quests.map(quest => (
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
                      <div className="text-xs font-bold text-primary mb-1">+{quest.xp || 0} XP</div>
                      {quest.completed ? (
                        <span className="text-sm font-bold text-success flex items-center"><CheckSquare className="w-4 h-4 mr-1" /> {t("completed") || "Completed"}</span>
                      ) : (
                        <span className="text-sm font-medium text-muted-foreground">{quest.progress || 0} / {quest.total || 1}</span>
                      )}
                    </div>
                    {!quest.completed && (
                      <Button variant="outline" size="sm" disabled={quest.progress < quest.total} onClick={() => quest.progress >= quest.total && handleClaim(quest.id)}>
                        {quest.progress >= quest.total ? (t("claim") || "Claim") : (t("play_now") || "Play Now")}
                      </Button>
                    )}
                    {quest.completed && (
                      <Button className="bg-success text-white" size="sm" disabled>{t("completed") || "Completed"}</Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center border border-dashed border-border rounded-xl">
                 <p className="text-muted-foreground font-semibold">{t("not_available") || "Chưa có"}</p>
                 <p className="text-sm text-muted-foreground/70">{t("no_quests") || "No active quests at the moment."}</p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
