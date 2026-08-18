"use client";

import { useState, useEffect } from "react";
import { Users, Search, UserPlus, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { fetchAPI } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

export default function FriendsPage() {
  const [mounted, setMounted] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    setMounted(true);
    fetchAPI('/friends')
      .then(res => setFriends(res.data || []))
      .catch(() => setFriends([]))
      .finally(() => setLoading(false));
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex flex-col space-y-10 pb-10 max-w-4xl mx-auto">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight">{t("nav.friends") || "Friends"}</h1>
          <p className="text-muted-foreground mt-1">{t("friends.subtitle") || "Connect with players and see what they're playing."}</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              className="w-full pl-9 bg-surface border-border" 
              placeholder={t("friends.find") || "Find friends..."} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button className="shrink-0"><UserPlus className="w-4 h-4 md:mr-2" /><span className="hidden md:inline">{t("friends.add") || "Add Friend"}</span></Button>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        {loading ? (
           <div className="p-8 text-center text-muted-foreground">{t("loading") || "Loading..."}</div>
        ) : (() => {
          const filteredFriends = friends.filter(friend => 
            friend.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
            friend.handle?.toLowerCase().includes(searchQuery.toLowerCase())
          );
          
          return filteredFriends.length > 0 ? (
            filteredFriends.map((friend, idx) => (
            <div key={friend.id} className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-secondary/50 ${idx !== friends.length - 1 ? 'border-b border-border' : ''}`}>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar size="lg" src={friend.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.name}`} fallback={friend.name?.charAt(0) || "F"} />
                  <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-surface ${
                    friend.status === 'Online' ? 'bg-success' : 
                    friend.status === 'In Game' ? 'bg-primary' : 'bg-muted-foreground'
                  }`} />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">{friend.name}</h3>
                  <p className="text-sm text-muted-foreground">{friend.handle}</p>
                  {friend.playing && (
                    <p className="text-xs font-medium text-primary mt-1">{t("friends.playing") || "Playing: "}{friend.playing}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm"><MessageSquare className="w-4 h-4 mr-2" /> {t("friends.message") || "Message"}</Button>
                <Button variant="ghost" size="sm">{t("nav.profile") || "Profile"}</Button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground font-semibold text-lg">{t("not_available") || "Chưa có"}</p>
            <p className="text-sm text-muted-foreground/70 mt-2">{t("friends.no_friends") || "You don't have any friends yet."}</p>
          </div>
        );
        })()}
      </div>

    </div>
  );
}
