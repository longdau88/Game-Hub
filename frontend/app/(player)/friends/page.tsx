"use client";

import { useState, useEffect } from "react";
import { Users, Search, UserPlus, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { fetchAPI } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import CreatorProfileModal from "@/components/CreatorProfileModal";

export default function FriendsPage() {
  const [mounted, setMounted] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'friends' | 'global'>('friends');
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    setMounted(true);
    fetchAPI('/friends')
      .then(res => setFriends(res.data || res || []))
      .catch(() => setFriends([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab !== 'global' || !searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    const timer = setTimeout(() => {
      fetchAPI(`/friends/search?q=${encodeURIComponent(searchQuery)}`)
        .then(res => {
          setSearchResults(Array.isArray(res) ? res : res.data || []);
        })
        .catch(() => setSearchResults([]))
        .finally(() => setIsSearching(false));
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchQuery, activeTab]);

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
        </div>
      </div>

      <div className="flex border-b border-border mb-6 gap-2">
        <button
          className={`pb-3 px-4 font-bold text-sm transition-colors border-b-2 ${
            activeTab === 'friends' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('friends')}
        >
          {t("friends.my_friends") || "My Friends"}
        </button>
        <button
          className={`pb-3 px-4 font-bold text-sm transition-colors border-b-2 ${
            activeTab === 'global' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('global')}
        >
          {t("friends.find_users") || "Find Users"}
        </button>
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        {loading || (isSearching && activeTab === 'global') ? (
           <div className="p-8 text-center text-muted-foreground">{t("loading") || "Loading..."}</div>
        ) : (() => {
          const displayList = activeTab === 'global' 
            ? searchResults 
            : friends.filter(friend => 
                friend.username?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                friend.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                friend.handle?.toLowerCase().includes(searchQuery.toLowerCase())
              );
          
          return displayList.length > 0 ? (
            displayList.map((user, idx) => (
            <div key={user.id} className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-secondary/50 ${idx !== displayList.length - 1 ? 'border-b border-border' : ''}`}>
              <div className="flex items-center gap-4 cursor-pointer" onClick={() => { setSelectedUserId(user.id); setIsProfileOpen(true); }}>
                <div className="relative">
                  <Avatar size="lg" src={user.avatarUrl || user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username || user.name}`} fallback={(user.username || user.name)?.charAt(0) || "U"} />
                  {user.status && (
                    <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-surface ${
                      user.status === 'Online' ? 'bg-success' : 
                      user.status === 'In Game' ? 'bg-primary' : 'bg-muted-foreground'
                    }`} />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">{user.username || user.name}</h3>
                  {(user.handle || user.level !== undefined) && (
                     <p className="text-sm text-muted-foreground">
                        {user.handle ? user.handle : `${t("nav.level") || "Level"} ${user.level}`}
                     </p>
                  )}
                  {user.playing && (
                    <p className="text-xs font-medium text-primary mt-1">{t("friends.playing") || "Playing: "}{user.playing}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {user.friendshipStatus === 'accepted' ? (
                  <Button variant="outline" size="sm"><MessageSquare className="w-4 h-4 mr-2" /> {t("friends.message") || "Message"}</Button>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedUserId(user.id); setIsProfileOpen(true); }}>
                    {t("nav.profile") || "Profile"}
                  </Button>
                )}
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

      <CreatorProfileModal
        creatorId={selectedUserId as number}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

    </div>
  );
}
