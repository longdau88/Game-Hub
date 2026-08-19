"use client";

import { useEffect, useState } from "react";
import { X, UserPlus, UserCheck, Loader2, Calendar, Gamepad2, Users, Star, Sparkles } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { useAppDialog } from "../contexts/DialogContext";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface CreatorProfileModalProps {
  creatorId: number;
  isOpen: boolean;
  onClose: () => void;
  onFollowChange?: (isFollowing: boolean) => void;
}

export default function CreatorProfileModal({ creatorId, isOpen, onClose, onFollowChange }: CreatorProfileModalProps) {
  const { t } = useLanguage();
  const { notify } = useAppDialog();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [friendLoading, setFriendLoading] = useState(false);
  const { token, requireAuth, profile: currentUser } = useAuth();

  useEffect(() => {
    if (!isOpen || !creatorId) return;

    setLoading(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    fetch(`${apiUrl}/api/users/${creatorId}/profile`, { headers })
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setProfile(data);
        } else {
          notify({ message: data.error, variant: "error" });
          onClose();
        }
      })
      .catch(err => {
        console.error(err);
        notify({ message: t("creator.load_failed") || "Failed to load profile", variant: "error" });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [creatorId, isOpen]);

  const handleFollow = async () => {
    if (!requireAuth()) return;
    
    // Save previous state for rollback
    const previousProfile = { ...profile };
    const isNowFollowing = !profile.isFollowing;
    
    // Optimistic Update
    setProfile((prev: any) => ({
      ...prev,
      isFollowing: isNowFollowing,
      _count: {
        ...prev._count,
        followers: isNowFollowing ? prev._count.followers + 1 : prev._count.followers - 1
      }
    }));
    if (onFollowChange) onFollowChange(isNowFollowing);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${apiUrl}/api/users/${creatorId}/follow`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      
      if (response.ok) {
        notify({ message: result.following ? (t("creator.followSuccess") || "Đã theo dõi") : (t("creator.unfollowSuccess") || "Đã bỏ theo dõi"), variant: "success" });
      } else {
        throw new Error(result.error || "Lỗi khi cập nhật theo dõi");
      }
    } catch (error: any) {
      console.error(error);
      // Rollback on failure
      setProfile(previousProfile);
      if (onFollowChange) onFollowChange(previousProfile.isFollowing);
      notify({ message: error.message || t("creator.connection_error") || "Lỗi kết nối", variant: "error" });
    }
  };

  const handleAddFriend = async () => {
    if (!requireAuth()) return;

    if (profile?.friendshipStatus === 'pending') {
      notify({ message: t("creator.friend_request_exists") || "Đã gửi yêu cầu kết bạn trước đó", variant: "info" });
      return;
    }

    // Save previous state for rollback
    const previousProfile = { ...profile };
    
    // Optimistic Update
    setProfile((prev: any) => ({ ...prev, friendshipStatus: 'pending' }));

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${apiUrl}/api/friends/request`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username: profile.username })
      });
      
      const result = await response.json();
      if (response.ok) {
        notify({ message: t("creator.friend_request_sent") || "Đã gửi yêu cầu kết bạn", variant: "success" });
      } else {
        throw new Error(result.error || (t("creator.friend_request_error") || "Lỗi gửi yêu cầu kết bạn"));
      }
    } catch (error: any) {
      console.error(error);
      // Rollback on failure
      setProfile(previousProfile);
      notify({ message: error.message || t("creator.connection_error") || "Lỗi kết nối", variant: "error" });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-white/40 dark:border-zinc-800/80 rounded-[2rem] w-full max-w-sm overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 rounded-full transition-colors z-20 backdrop-blur-md"
            >
              <X className="w-4 h-4 text-zinc-900 dark:text-white" />
            </button>

            {loading ? (
              <div className="h-[400px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : profile ? (
              <div className="flex flex-col">
                {/* Header / Cover */}
                <div className="h-32 relative bg-zinc-100 dark:bg-zinc-800">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/80 via-purple-400/80 to-pink-400/80 dark:from-blue-600/80 dark:via-purple-600/80 dark:to-pink-600/80 animate-gradient-x" />
                  <div className="absolute inset-0 bg-black/10 dark:bg-black/20" />
                  
                  {/* Avatar overlapping */}
                  <div className="absolute -bottom-10 left-6 z-10">
                    <div className="w-24 h-24 rounded-full p-1 bg-white/30 dark:bg-zinc-900/50 backdrop-blur-sm shadow-xl">
                      <div className="w-full h-full rounded-full border-[3px] border-white dark:border-zinc-900 overflow-hidden bg-zinc-200 dark:bg-zinc-800 relative group">
                        <img 
                          src={profile.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=GameHub`} 
                          alt={profile.username} 
                          className="w-full h-full object-cover" 
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-6 pt-14 pb-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
                        {profile.username}
                        <span className="px-2.5 py-0.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[10px] rounded-full font-black shadow-sm uppercase tracking-wider">
                          Lv.{profile.level}
                        </span>
                      </h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        {t("creator.joined") || "Joined"} {new Date(profile.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {profile.bio && (
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-6 line-clamp-3 leading-relaxed">
                      {profile.bio}
                    </p>
                  )}

                  {/* Stats Glassmorphism Blocks */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-white/50 dark:bg-zinc-800/50 border border-white/60 dark:border-zinc-700/50 rounded-2xl p-3 text-center backdrop-blur-md shadow-sm transition-transform hover:scale-[1.02]">
                      <div className="flex justify-center mb-1"><Gamepad2 className="w-4 h-4 text-blue-500" /></div>
                      <div className="text-xl font-black text-zinc-900 dark:text-white">
                        {profile._count?.games || 0}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">{t("creator.games") || "Games"}</div>
                    </div>
                    <div className="bg-white/50 dark:bg-zinc-800/50 border border-white/60 dark:border-zinc-700/50 rounded-2xl p-3 text-center backdrop-blur-md shadow-sm transition-transform hover:scale-[1.02]">
                      <div className="flex justify-center mb-1"><Users className="w-4 h-4 text-purple-500" /></div>
                      <div className="text-xl font-black text-zinc-900 dark:text-white">
                        {profile._count?.followers || 0}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">{t("creator.followers") || "Followers"}</div>
                    </div>
                  </div>

                  {currentUser?.id !== profile.id && (
                    <div className="flex gap-3">
                      <button 
                        onClick={handleFollow}
                        disabled={followLoading}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 relative overflow-hidden group ${
                          profile.isFollowing 
                            ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700" 
                            : "text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] hover:-translate-y-0.5"
                        }`}
                      >
                        {!profile.isFollowing && (
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 group-hover:from-blue-400 group-hover:to-purple-500 transition-colors" />
                        )}
                        <div className="relative flex items-center gap-2 z-10">
                          {profile.isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />} 
                          {profile.isFollowing 
                            ? (t("creator.following") || "Đang theo dõi") 
                            : profile.isFollower 
                            ? (t("creator.followBack") || "Theo dõi lại") 
                            : (t("creator.follow") || "Theo dõi")}
                        </div>
                      </button>
                      
                      <button
                        onClick={handleAddFriend}
                        disabled={friendLoading || profile.friendshipStatus === 'accepted' || profile.friendshipStatus === 'pending'}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${
                          profile.friendshipStatus === 'accepted'
                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
                            : profile.friendshipStatus === 'pending'
                            ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700"
                            : "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-zinc-300 dark:hover:border-zinc-600"
                        }`}
                      >
                        <UserPlus className="w-4 h-4" />
                        {profile.friendshipStatus === 'accepted' 
                          ? (t("creator.friend") || "Bạn bè") 
                          : profile.friendshipStatus === 'pending' 
                          ? (t("creator.friend_pending") || "Đã gửi Yêu cầu") 
                          : (t("creator.add_friend") || "Kết bạn")}
                      </button>
                    </div>
                  )}

                  {/* Games List */}
                  {profile.games && profile.games.length > 0 && (
                    <div className="mt-8">
                      <h4 className="text-sm font-bold mb-4 text-zinc-900 dark:text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-yellow-500" />
                        {t("creator.featured_games") || "Game Nổi Bật"}
                      </h4>
                      <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar -mx-2 px-2">
                        {profile.games.map((game: any) => (
                          <Link 
                            key={game.id} 
                            href={`/game/play?id=${game.id}`}
                            className="min-w-[120px] max-w-[120px] flex-shrink-0 snap-start group relative block"
                          >
                            <div className="aspect-[4/5] bg-zinc-100 dark:bg-zinc-800 rounded-2xl mb-3 overflow-hidden relative shadow-sm border border-zinc-200/50 dark:border-zinc-700/50 group-hover:shadow-xl group-hover:border-blue-500/50 transition-all duration-300 group-hover:-translate-y-1">
                              {game.coverImageUrl ? (
                                <img src={game.coverImageUrl} alt={game.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-400 text-3xl font-black bg-zinc-200 dark:bg-zinc-800">
                                  {game.title.charAt(0)}
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
                                <span className="text-[10px] font-bold flex items-center gap-1 bg-black/40 backdrop-blur-md px-1.5 py-0.5 rounded-md"><Star className="w-3 h-3 fill-yellow-500 text-yellow-500" /> {game.averageRating || 'New'}</span>
                              </div>
                            </div>
                            <div className="text-sm font-bold text-zinc-900 dark:text-white truncate group-hover:text-blue-500 transition-colors">{game.title}</div>
                            <div className="text-[11px] font-medium text-zinc-500 mt-0.5 flex items-center gap-1">
                              <Gamepad2 className="w-3 h-3" /> {game.playCount.toLocaleString()} {t("creator.plays") || "plays"}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-[400px] flex flex-col items-center justify-center text-center p-6">
                <p className="text-zinc-500 font-medium">{t("creator.not_found") || "Profile not found"}</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
