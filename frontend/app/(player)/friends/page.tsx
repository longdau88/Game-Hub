"use client";

import { useState, useEffect } from "react";
import { Users, Search, UserPlus, MessageSquare, UserMinus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { fetchAPI } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppDialog } from "@/contexts/DialogContext";
import Cookies from "js-cookie";
import CreatorProfileModal from "@/components/CreatorProfileModal";
import useSWR, { useSWRConfig } from "swr";

export default function FriendsPage() {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'friends' | 'global' | 'following' | 'requests' | 'followers'>('friends');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const { t } = useLanguage();
  const { confirm, notify } = useAppDialog();
  const { mutate } = useSWRConfig();

  // SWR data fetching
  const { data: friends = [], isLoading: friendsLoading } = useSWR('/friends');
  const { data: following = [], mutate: mutateFollowing, isLoading: followingLoading } = useSWR('/users/following');
  const { data: followers = [], isLoading: followersLoading } = useSWR('/users/followers');
  const { data: pendingRequests = [], mutate: mutatePending, isLoading: pendingLoading } = useSWR('/friends/pending');

  const loading = friendsLoading || followingLoading || followersLoading || pendingLoading;

  const getAuthHeaders = () => {
    const token = Cookies.get("token");
    return { "Authorization": `Bearer ${token}` };
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleUnfollow = async (creatorId: number) => {
    if (!await confirm({ message: t("profile.confirmUnfollow") || "Are you sure you want to unfollow this creator?", variant: "warning" })) return;
    
    // Optimistic UI Update
    const previousFollowing = [...following];
    mutateFollowing(previousFollowing.filter((c: any) => c.id !== creatorId), false);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/users/${creatorId}/follow`, {
        method: "POST",
        headers: getAuthHeaders()
      });
      if (res.ok) {
        await notify({ message: t("profile.unfollowSuccess") || "Unfollowed successfully", variant: "success" });
        mutateFollowing(); // Revalidate
      } else {
        throw new Error("Failed");
      }
    } catch (error) {
      mutateFollowing(previousFollowing, false); // Rollback
      await notify({ message: t("dialog.genericError"), variant: "error" });
    }
  };

  const handleAcceptRequest = async (id: number, senderId: number) => {
    const previousPending = [...pendingRequests];
    mutatePending(previousPending.filter((req: any) => req.friendshipId !== id), false);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/friends/accept/${id}`, {
        method: "POST",
        headers: getAuthHeaders()
      });
      if (res.ok) {
        mutate('/friends'); // Refresh friends list
        mutatePending(); // Revalidate pending
        await notify({ message: t("friends.acceptSuccess") || "Friend request accepted.", variant: "success" });
      } else {
        throw new Error("Failed");
      }
    } catch (error) {
      mutatePending(previousPending, false); // Rollback
      await notify({ message: t("dialog.genericError"), variant: "error" });
    }
  };

  const handleRejectRequest = async (id: number) => {
    const previousPending = [...pendingRequests];
    mutatePending(previousPending.filter((req: any) => req.friendshipId !== id), false);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/friends/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (res.ok) {
        mutatePending(); // Revalidate
        await notify({ message: t("friends.rejectSuccess") || "Friend request rejected.", variant: "success" });
      } else {
        throw new Error("Failed");
      }
    } catch (error) {
      mutatePending(previousPending, false); // Rollback
      await notify({ message: t("dialog.genericError"), variant: "error" });
    }
  };

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

  const handleModalClose = () => {
    setIsProfileOpen(false);
    // Refresh lists just in case user followed/added friends in modal
    mutate('/friends');
    mutate('/users/following');
    mutate('/friends/pending');
  };

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

      <div className="flex border-b border-border mb-6 gap-2 overflow-x-auto whitespace-nowrap hide-scrollbar">
        <button
          className={`pb-3 px-4 font-bold text-sm transition-colors border-b-2 shrink-0 ${
            activeTab === 'friends' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('friends')}
        >
          {t("friends.my_friends") || "My Friends"}
        </button>
        <button
          className={`pb-3 px-4 font-bold text-sm transition-colors border-b-2 shrink-0 flex items-center gap-2 ${
            activeTab === 'requests' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('requests')}
        >
          {t("friends.requests") || "Requests"}
          {pendingRequests.length > 0 && (
            <span className="bg-error text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingRequests.length}</span>
          )}
        </button>
        <button
          className={`pb-3 px-4 font-bold text-sm transition-colors border-b-2 shrink-0 ${
            activeTab === 'following' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('following')}
        >
          {t("profile.tabFollowing") || "Đang theo dõi"}
        </button>
        <button
          className={`pb-3 px-4 font-bold text-sm transition-colors border-b-2 shrink-0 ${
            activeTab === 'followers' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('followers')}
        >
          {t("friends.followers") || "Người theo dõi"}
        </button>
        <button
          className={`pb-3 px-4 font-bold text-sm transition-colors border-b-2 shrink-0 ${
            activeTab === 'global' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('global')}
        >
          {t("friends.find_users") || "Find Users"}
        </button>
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden min-h-[300px]">
        {loading && !friends.length && !following.length && !followers.length && !pendingRequests.length ? (
           <div className="p-12 text-center text-muted-foreground animate-pulse">
             <div className="w-12 h-12 rounded-full bg-secondary mx-auto mb-4" />
             <div className="h-4 bg-secondary w-32 mx-auto rounded" />
           </div>
        ) : activeTab === 'requests' ? (
          <div className="p-4 flex flex-col gap-4">
            {pendingRequests.length === 0 ? (
              <div className="p-12 text-center">
                <UserPlus className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground font-semibold text-lg">{t("friends.noRequests") || "No pending requests."}</p>
              </div>
            ) : (
              pendingRequests.map((req: any) => (
                <div key={req.friendshipId} className="p-4 flex items-center justify-between gap-4 border border-border rounded-xl bg-secondary/20 transition-all">
                  <div className="flex items-center gap-4 cursor-pointer" onClick={() => { setSelectedUserId(req.sender.id); setIsProfileOpen(true); }}>
                    <Avatar size="lg" src={req.sender.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.sender.username}`} fallback={req.sender.username.charAt(0)} />
                    <div>
                      <h3 className="font-bold text-lg hover:text-primary transition-colors">{req.sender.username}</h3>
                      <p className="text-sm text-muted-foreground">Level {req.sender.level || 1}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleRejectRequest(req.friendshipId)} className="text-muted-foreground hover:text-error hover:bg-error/10">
                      <X className="w-4 h-4 mr-1" /> {t("friends.reject") || "Reject"}
                    </Button>
                    <Button size="sm" onClick={() => handleAcceptRequest(req.friendshipId, req.sender.id)}>
                      <Check className="w-4 h-4 mr-1" /> {t("friends.accept") || "Accept"}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : activeTab === 'followers' ? (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {followers.filter((creator: any) => creator.username?.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
              <div className="col-span-1 md:col-span-2 p-12 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground font-semibold text-lg">{t("friends.noFollowers") || "You don't have any followers yet."}</p>
              </div>
            ) : (
              followers.filter((creator: any) => creator.username?.toLowerCase().includes(searchQuery.toLowerCase())).map((creator: any) => (
                <div key={creator.id} className="group relative flex items-center gap-4 bg-surface hover:bg-secondary/50 border border-border p-4 rounded-2xl transition-all duration-300">
                  <div 
                    className="w-16 h-16 rounded-full overflow-hidden shrink-0 border border-border cursor-pointer"
                    onClick={() => { setSelectedUserId(creator.id); setIsProfileOpen(true); }}
                  >
                    <img src={creator.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.username}`} alt={creator.username} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 
                      className="font-bold text-foreground text-lg truncate cursor-pointer group-hover:text-primary transition-colors"
                      onClick={() => { setSelectedUserId(creator.id); setIsProfileOpen(true); }}
                    >
                      {creator.username}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-2">Level {creator.level || 1}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : activeTab === 'following' ? (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {following.filter((creator: any) => creator.username?.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
              <div className="col-span-1 md:col-span-2 p-12 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground font-semibold text-lg">{t("profile.noFollowing") || "You are not following any creators yet."}</p>
              </div>
            ) : (
              following.filter((creator: any) => creator.username?.toLowerCase().includes(searchQuery.toLowerCase())).map((creator: any) => (
                <div key={creator.id} className="group relative flex items-center gap-4 bg-surface hover:bg-secondary/50 border border-border p-4 rounded-2xl transition-all duration-300">
                  <div 
                    className="w-16 h-16 rounded-full overflow-hidden shrink-0 border border-border cursor-pointer"
                    onClick={() => { setSelectedUserId(creator.id); setIsProfileOpen(true); }}
                  >
                    <img src={creator.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.username}`} alt={creator.username} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 
                      className="font-bold text-foreground text-lg truncate cursor-pointer group-hover:text-primary transition-colors"
                      onClick={() => { setSelectedUserId(creator.id); setIsProfileOpen(true); }}
                    >
                      {creator.username}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{creator.bio || t("profile.noBio")}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                        {creator.publishedGamesCount !== undefined ? `${creator.publishedGamesCount} ${t("profile.publishedGames") || "Games"}` : `Level ${creator.level || 1}`}
                      </span>
                      <button 
                        onClick={() => handleUnfollow(creator.id)}
                        className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-error transition-colors"
                      >
                        <UserMinus className="w-3 h-3" /> {t("creator.unfollow") || "Unfollow"}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (() => {
          const displayList = activeTab === 'global' 
            ? searchResults 
            : friends.filter((friend: any) => 
                friend.username?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                friend.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                friend.handle?.toLowerCase().includes(searchQuery.toLowerCase())
              );
          
          return displayList.length > 0 ? (
            displayList.map((user: any, idx: number) => (
            <div key={user.id} className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-secondary/30 ${idx !== displayList.length - 1 ? 'border-b border-border' : ''}`}>
              <div className="flex items-center gap-4 cursor-pointer group" onClick={() => { setSelectedUserId(user.id); setIsProfileOpen(true); }}>
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
        onClose={handleModalClose}
      />

    </div>
  );
}
