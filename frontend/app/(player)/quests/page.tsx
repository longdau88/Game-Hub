"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckSquare, Gift, Zap, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { fetchAPI } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppDialog } from "@/contexts/DialogContext";
import { useAuth } from "@/contexts/AuthContext";

export default function QuestsPage() {
  const [mounted, setMounted] = useState(false);
  const [quests, setQuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("DAILY");
  const { t, locale } = useLanguage();
  const { notify } = useAppDialog();
  const { updateProfile } = useAuth();
  const isVi = locale === 'vi';

  const translateQuestTitle = (title: string) => {
    if (title === 'Play a Game') return t("quests.play_game") || title;
    if (title === 'Rate a Game') return t("quests.rate_game") || title;
    if (title === 'Daily Login') return t("quests.daily_login") || title;
    if (title === 'Add a Friend') return t("quests.add_friend") || "Thêm một người bạn";
    if (title === 'Follow a Creator') return t("quests.follow_creator") || "Theo dõi một Creator";
    return title;
  };

  const getQuestLink = (targetType: string) => {
    switch (targetType) {
      case 'play_game': return '/';
      case 'rate_game': return '/discover';
      case 'login': return '/profile';
      case 'add_friend': return '/friends';
      case 'follow_creator': return '/discover';
      default: return '/';
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchAPI('/gamification/quests/active')
      .then(res => {
         const data = Array.isArray(res) ? res : (res.data || []);
         setQuests(data.map((q: any) => ({
           id: q.id,
           type: q.frequency,
           title: q.title,
           desc: q.description || '',
           targetType: q.targetType,
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
        updateProfile({ xp: res.xp, level: res.level });
        notify({ message: `+${res.reward} XP! ${t("quests.reward_claimed") || "Phần thưởng đã được nhận!"}`, variant: "success" });
      } else {
        notify({ message: res.error, variant: "error" });
      }
    } catch (e) {
      console.error(e);
      notify({ message: t("error") || "Lỗi", variant: "error" });
    }
  };
  
  if (!mounted) return null;

  const completedQuestsCount = quests.filter(q => q.completed).length;
  const totalQuestsCount = quests.length > 0 ? quests.length : 5; // Fallback to 5 if loading
  const progressPercent = Math.min((completedQuestsCount / totalQuestsCount) * 100, 100);

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
            <p className="text-indigo-100 text-sm mb-4">{t("quests.weekly_chest_desc") || `Hoàn thành ${totalQuestsCount} nhiệm vụ để mở khóa.`}</p>
            <div className="w-full bg-black/20 rounded-full h-2 mb-2">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${progressPercent}%` }} 
              />
            </div>
            <p className="text-xs text-indigo-100 text-right">{completedQuestsCount}/{totalQuestsCount} {t("quests.quests_count") || "Quests"}</p>
          </CardContent>
        </Card>
        
        <div className="md:col-span-2 space-y-4">
          <div className="flex bg-surface border border-border rounded-lg overflow-hidden">
            {['DAILY', 'WEEKLY', 'MONTHLY', 'LIFETIME'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-sm font-bold transition-colors ${activeTab === tab ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-muted-foreground hover:bg-surface-hover'}`}
              >
                {tab === 'DAILY' && (isVi ? "Hàng Ngày" : "Daily")}
                {tab === 'WEEKLY' && (isVi ? "Hàng Tuần" : "Weekly")}
                {tab === 'MONTHLY' && (isVi ? "Hàng Tháng" : "Monthly")}
                {tab === 'LIFETIME' && (isVi ? "Trọn Đời" : "Lifetime")}
              </button>
            ))}
          </div>
            
          <div className="mt-4 space-y-4">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">{t("loading") || "Loading..."}</div>
            ) : quests.filter(q => q.type === activeTab).length > 0 ? (
              quests.filter(q => q.type === activeTab).map(quest => (
                <div key={quest.id} className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${quest.completed ? 'bg-success/10 border-success/30' : 'bg-surface border-border hover:border-primary/50'}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        quest.type === 'WEEKLY' ? 'bg-purple-500/20 text-purple-500' : 
                        quest.type === 'MONTHLY' ? 'bg-amber-500/20 text-amber-500' : 
                        quest.type === 'LIFETIME' ? 'bg-red-500/20 text-red-500' : 
                        'bg-blue-500/20 text-blue-500'
                      }`}>
                        {quest.type}
                      </span>
                      <h3 className="font-bold text-foreground">{translateQuestTitle(quest.title)}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{quest.desc}</p>
                  </div>
                  
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-bold text-primary mb-1">+{quest.xp || 0} XP</div>
                      {quest.completed ? (
                        <span className="text-sm font-bold text-success flex items-center"><CheckSquare className="w-4 h-4 mr-1" /> {t("quests.completed") || "Completed"}</span>
                      ) : (
                        <span className="text-sm font-medium text-muted-foreground">{quest.progress || 0} / {quest.total || 1}</span>
                      )}
                    </div>
                    {!quest.completed && (
                      quest.progress >= quest.total ? (
                        <Button variant="outline" size="sm" onClick={() => handleClaim(quest.id)}>
                          {t("claim") || "Claim"}
                        </Button>
                      ) : (
                        <Link href={getQuestLink(quest.targetType)}>
                          <Button variant="outline" size="sm">
                            {t("quests.complete_now") || "Hoàn thành ngay"}
                          </Button>
                        </Link>
                      )
                    )}
                    {quest.completed && (
                      <Button className="bg-success text-white" size="sm" disabled>{t("quests.completed") || "Completed"}</Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground border border-dashed rounded-xl border-border bg-surface/50">
                {isVi ? "Không có nhiệm vụ nào." : "No quests available."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
