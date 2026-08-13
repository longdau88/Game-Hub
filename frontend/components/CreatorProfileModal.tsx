"use client";

import { useEffect, useState } from "react";
import { X, UserPlus, UserCheck, Loader2, Calendar, Gamepad2, Users } from "lucide-react";
import Cookies from "js-cookie";
import { useLanguage } from "../contexts/LanguageContext";
import { useAppDialog } from "../contexts/DialogContext";

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

  useEffect(() => {
    if (!isOpen || !creatorId) return;

    setLoading(true);
    const token = Cookies.get("token");
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
        notify({ message: "Failed to load profile", variant: "error" });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [creatorId, isOpen]);

  const handleFollow = async () => {
    const token = Cookies.get("token");
    if (!token) {
      notify({ message: t("dialog.loginRequired") || "Vui lòng đăng nhập", variant: "info" });
      return;
    }
    
    setFollowLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${apiUrl}/api/users/${creatorId}/follow`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      
      if (response.ok) {
        setProfile((prev: any) => ({
          ...prev,
          isFollowing: result.following,
          _count: {
            ...prev._count,
            followers: result.following ? prev._count.followers + 1 : prev._count.followers - 1
          }
        }));
        if (onFollowChange) onFollowChange(result.following);
        notify({ message: result.following ? (t("creator.followSuccess") || "Đã theo dõi") : (t("creator.unfollowSuccess") || "Đã bỏ theo dõi"), variant: "success" });
      } else {
        notify({ message: result.error || "Lỗi khi cập nhật theo dõi", variant: "error" });
      }
    } catch (error) {
      console.error(error);
      notify({ message: "Lỗi kết nối", variant: "error" });
    } finally {
      setFollowLoading(false);
    }
  };

  const handleAddFriend = async () => {
    const token = Cookies.get("token");
    if (!token) {
      notify({ message: t("dialog.loginRequired") || "Vui lòng đăng nhập", variant: "info" });
      return;
    }

    if (profile?.friendshipStatus === 'pending') {
      notify({ message: "Đã gửi yêu cầu kết bạn trước đó", variant: "info" });
      return;
    }

    setFriendLoading(true);
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
        setProfile((prev: any) => ({ ...prev, friendshipStatus: 'pending' }));
        notify({ message: "Đã gửi yêu cầu kết bạn", variant: "success" });
      } else {
        notify({ message: result.error || "Lỗi gửi yêu cầu kết bạn", variant: "error" });
      }
    } catch (error) {
      console.error(error);
      notify({ message: "Lỗi kết nối", variant: "error" });
    } finally {
      setFriendLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 rounded-full transition-colors z-10"
        >
          <X className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
        </button>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : profile ? (
          <div className="flex flex-col">
            {/* Header / Cover */}
            <div className="h-24 bg-gradient-to-r from-blue-500 to-purple-600 relative">
              <div className="absolute -bottom-10 left-6">
                <div className="w-20 h-20 rounded-full border-4 border-white dark:border-zinc-900 overflow-hidden bg-zinc-200 dark:bg-zinc-800">
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt={profile.username} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-zinc-500">
                      {profile.username?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 pt-12 pb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    {profile.username}
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-xs rounded-full font-medium">
                      Lv.{profile.level}
                    </span>
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Tham gia {new Date(profile.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {profile.bio && (
                <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-6 line-clamp-3">
                  {profile.bio}
                </p>
              )}

              <div className="flex justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl mb-6">
                <div className="text-center flex-1">
                  <div className="text-lg font-bold text-zinc-900 dark:text-white">
                    {profile._count?.games || 0}
                  </div>
                  <div className="text-xs text-zinc-500 flex items-center justify-center gap-1">
                    <Gamepad2 className="w-3 h-3" /> Games
                  </div>
                </div>
                <div className="w-px bg-zinc-200 dark:bg-zinc-700"></div>
                <div className="text-center flex-1">
                  <div className="text-lg font-bold text-zinc-900 dark:text-white">
                    {profile._count?.followers || 0}
                  </div>
                  <div className="text-xs text-zinc-500 flex items-center justify-center gap-1">
                    <Users className="w-3 h-3" /> Followers
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                    profile.isFollowing 
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700" 
                      : "bg-blue-600 hover:bg-blue-500 text-white shadow-sm hover:shadow"
                  }`}
                >
                  {profile.isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />} 
                  {profile.isFollowing ? "Đang theo dõi" : "Theo dõi"}
                </button>
                
                <button
                  onClick={handleAddFriend}
                  disabled={friendLoading || profile.friendshipStatus === 'accepted' || profile.friendshipStatus === 'pending'}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                    profile.friendshipStatus === 'accepted'
                      ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-transparent"
                      : profile.friendshipStatus === 'pending'
                      ? "bg-zinc-50 dark:bg-zinc-800 text-zinc-500 border-transparent"
                      : "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  {profile.friendshipStatus === 'accepted' 
                    ? "Bạn bè" 
                    : profile.friendshipStatus === 'pending' 
                    ? "Đã gửi Yêu cầu" 
                    : "Kết bạn"}
                </button>
              </div>

              {/* Games List */}
              {profile.games && profile.games.length > 0 && (
                <div className="mt-6 border-t border-zinc-200 dark:border-zinc-800 pt-4">
                  <h4 className="text-sm font-semibold mb-3 text-zinc-900 dark:text-white">Game Đã Đăng</h4>
                  <div className="flex gap-3 overflow-x-auto pb-2 snap-x" style={{ scrollbarWidth: 'none' }}>
                    {profile.games.map((game: any) => (
                      <a 
                        key={game.id} 
                        href={`/game/play?id=${game.id}`}
                        className="min-w-[100px] max-w-[100px] flex-shrink-0 snap-start group"
                      >
                        <div className="aspect-square bg-zinc-200 dark:bg-zinc-800 rounded-lg mb-2 overflow-hidden relative">
                          {game.coverImageUrl ? (
                            <img src={game.coverImageUrl} alt={game.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-500 text-2xl font-bold bg-zinc-300 dark:bg-zinc-700">
                              {game.title.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="text-xs font-medium text-zinc-900 dark:text-white truncate group-hover:text-blue-500 transition-colors">{game.title}</div>
                        <div className="text-[10px] text-zinc-500">{game.playCount.toLocaleString()} lượt chơi</div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6">
            <p className="text-zinc-500">Profile not found</p>
          </div>
        )}
      </div>
    </div>
  );
}
