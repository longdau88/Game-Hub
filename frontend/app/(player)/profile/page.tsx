"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { User, Settings, Gamepad2, Play, Save, History, Bookmark, UploadCloud, ShieldAlert, Star, Users, UserMinus, Folder, FolderPlus, Trash2, Target, CheckCircle2, Flame, Clock, Search } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppDialog } from "@/contexts/DialogContext";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import CreatorProfileModal from "@/components/CreatorProfileModal";

export default function ProfilePage() {
  const router = useRouter();
  const { locale: language, t } = useLanguage();
  const { confirm, notify } = useAppDialog();
  
  const [activeTab, setActiveTab] = useState("settings");
  
  const [profile, setProfile] = useState<any>(null);
  const [uploadedGames, setUploadedGames] = useState<any[]>([]);

  const [selectedCreatorId, setSelectedCreatorId] = useState<number | null>(null);
  const [isCreatorProfileOpen, setIsCreatorProfileOpen] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState({ text: "", isError: false });
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState({ text: "", isError: false });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchUploadedGames();
  }, []);

  const getAuthHeaders = () => {
    const token = Cookies.get("token");
    return { "Authorization": `Bearer ${token}` };
  };

  const fetchProfile = async () => {
    const token = Cookies.get("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/users/me`, {
        headers: getAuthHeaders()
      });
      
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setUsername(data.username);
        setAvatarUrl(data.avatarUrl || "");
        setBio(data.bio || "");
      } else {
        Cookies.remove("token");
        Cookies.remove("role");
        router.push("/login");
      }
    } catch (error) {
      console.error("Failed to fetch profile", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUploadedGames = async () => {
    if (!Cookies.get("token")) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/games/creator/games`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setUploadedGames(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteGame = async (gameId: string) => {
    if (!await confirm({ message: t("profile.confirmDelete"), variant: "warning" })) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/games/${gameId}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (res.ok) {
        await notify({ message: t("profile.deleteSuccess"), variant: "success" });
        setUploadedGames(uploadedGames.filter(g => g.id !== gameId));
        fetchProfile();
      } else {
        const data = await res.json();
        await notify({ message: t("profile.deleteError"), variant: "error" });
      }
    } catch (error) {
      await notify({ message: t("profile.deleteError"), variant: "error" });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: "", isError: false });

    let finalAvatarUrl = avatarUrl;
    if (selectedImage) {
      try {
        setUploadingAvatar(true);
        const formData = new FormData();
        formData.append("image", selectedImage);
        formData.append("key", "0e18a17f54e1f13f1f2d7640c7cf1bd8");
        const imgbbRes = await fetch("https://api.imgbb.com/1/upload", { method: "POST", body: formData });
        const imgbbData = await imgbbRes.json();
        if (imgbbData.success) {
          finalAvatarUrl = imgbbData.data.url;
          setAvatarUrl(finalAvatarUrl);
          setSelectedImage(null);
        } else {
          setMessage({ text: "Failed to upload image to Imgbb", isError: true });
          setSaving(false); setUploadingAvatar(false); return;
        }
      } catch (err) {
        setMessage({ text: "Error uploading image", isError: true });
        setSaving(false); setUploadingAvatar(false); return;
      } finally {
        setUploadingAvatar(false);
      }
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/users/me`, {
        method: "PUT",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ username, avatarUrl: finalAvatarUrl, bio })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: t("profile.success"), isError: false });
        await notify({ message: t("profile.success"), variant: "success" });
        setProfile({ ...profile, username, avatarUrl: finalAvatarUrl, bio });
      } else {
        setMessage({ text: data.error || "Failed to update profile", isError: true });
      }
    } catch (error) {
      setMessage({ text: "Network error", isError: true });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage({ text: "", isError: false });
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: t("profile.passwordsNotMatch"), isError: true });
      return;
    }
    setChangingPassword(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/users/me/password`, {
        method: "PUT",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordMessage({ text: data.message, isError: false });
        setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
        await notify({ message: t("profile.passwordSuccess"), variant: "success" });
      } else {
        setPasswordMessage({ text: data.error || "Failed to change password", isError: true });
      }
    } catch (error) {
      setPasswordMessage({ text: "Network error", isError: true });
    } finally {
      setChangingPassword(false);
    }
  };

  const GameListCard = ({ game, type }: { game: any, type?: 'history' | 'bookmark' }) => (
    <div className="group relative flex items-center gap-4 bg-white/50 dark:bg-zinc-900/50 hover:bg-zinc-100/80 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-800 p-3 rounded-2xl transition-all duration-300">
      <Link href={`/game/play?id=${game.id}`} className="w-24 h-24 aspect-square rounded-xl overflow-hidden relative shrink-0 border border-black/5 dark:border-white/5">
        <img src={game.coverImageUrl || '/placeholder.png'} alt={game.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-8 h-8 rounded-full bg-blue-600/90 flex items-center justify-center text-zinc-900 dark:text-white shadow-lg backdrop-blur-sm">
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </div>
        </div>
      </Link>
      <div className="flex-1 py-1">
        <Link href={`/game/play?id=${game.id}`}>
          <h3 className="font-bold text-zinc-900 dark:text-white text-lg group-hover:text-blue-400 transition-colors line-clamp-1">{game.title}</h3>
        </Link>
        <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 mb-1.5 mt-1">
          <span className="text-yellow-500 flex items-center gap-1 bg-yellow-500/10 px-1.5 py-0.5 rounded"><Star className="w-3 h-3 fill-current" /> {game.averageRating || 'New'}</span>
          <span>•</span>
          <span>{game.categories?.[0]?.nameTranslations?.[language] || game.categories?.[0]?.name || 'Uncategorized'}</span>
        </div>
        <p className="text-xs text-zinc-500 line-clamp-1">{game.descriptionTranslations?.[language] || game.description}</p>
        
        {type === 'history' && game.lastPlayedAt && (
          <p className="text-[10px] text-zinc-600 mt-2 font-medium">Last played: {new Date(game.lastPlayedAt).toLocaleString()}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-transparent py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Profile Header */}
        <div className="relative mb-12 rounded-[2rem] overflow-hidden bg-white/80 dark:bg-zinc-900/80 border border-white/60 dark:border-zinc-800 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] backdrop-blur-2xl">
          <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-r from-blue-400/80 via-purple-400/80 to-pink-400/80 dark:from-blue-600/80 dark:via-purple-600/80 dark:to-pink-600/80 animate-gradient-x" />
          <div className="absolute top-0 left-0 w-full h-40 bg-black/10 dark:bg-black/20" />
          
          <div className="relative z-10 px-8 pb-8 pt-24 flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
            <div className="w-32 h-32 rounded-full p-1 bg-white/30 dark:bg-zinc-900/50 backdrop-blur-md shadow-xl shrink-0 -mt-16 md:mt-0">
              <div className="w-full h-full rounded-full border-[4px] border-white dark:border-zinc-900 overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                <img src={profile?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=GameHub`} alt="Avatar" className="w-full h-full object-cover" />
              </div>
            </div>
            
            <div className="flex-1 mt-4 md:mt-0">
              <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight mb-2 flex flex-wrap justify-center md:justify-start items-center gap-3">
                {profile?.username || "Player"}
                <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs rounded-full font-black shadow-sm uppercase tracking-wider">
                  Lv. {profile?.level || 1}
                </span>
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-4 flex items-center justify-center md:justify-start gap-2 font-medium">
                <ShieldAlert className="w-4 h-4 text-blue-500" /> {t("profile.role")}: <span className="text-zinc-900 dark:text-white capitalize">{profile?.role}</span>
              </p>
              <p className="text-zinc-700 dark:text-zinc-300 max-w-xl text-sm leading-relaxed">{profile?.bio || t("profile.noBio")}</p>
            </div>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-6 md:mt-0">
              <div className="text-center px-5 py-3 bg-white/50 dark:bg-zinc-800/50 rounded-2xl border border-white/60 dark:border-zinc-700/50 backdrop-blur-md shadow-sm transition-transform hover:scale-[1.02]">
                <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mb-0.5">{uploadedGames.length}</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{t("profile.myUploads")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto hide-scrollbar gap-1 sm:gap-2 mb-8 bg-white/60 dark:bg-zinc-900/60 p-2 rounded-2xl border border-white/40 dark:border-zinc-800/80 w-full sm:w-fit mx-auto backdrop-blur-xl shadow-sm relative z-20">
          {[
            { id: 'settings', icon: Settings, label: t("profile.tabSettings") },
            { id: 'uploads', icon: UploadCloud, label: t("profile.myUploads") }
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors whitespace-nowrap ${
                  isActive 
                    ? 'text-blue-600 dark:text-white' 
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-200/50 dark:border-zinc-700/50"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <tab.icon className="w-4 h-4" /> {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'settings' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-2 space-y-6">
                    <div className="bg-white/70 dark:bg-zinc-900/50 border border-white/60 dark:border-zinc-800 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
                      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-400" /> {t("profile.publicProfile")}
                      </h2>
                      
                      {message.text && (
                        <div className={`p-4 rounded-xl mb-6 text-sm font-medium ${message.isError ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-green-500/10 border border-green-500/20 text-green-400'}`}>
                          {message.text}
                        </div>
                      )}

                      <form onSubmit={handleSave} className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">{t("profile.email")}</label>
                          <input type="email" value={profile?.email || ""} disabled className="w-full bg-zinc-100 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-500 cursor-not-allowed" />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">{t("profile.username")}</label>
                          <input type="text" value={username} onChange={e => setUsername(e.target.value)} required className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-blue-500 rounded-xl px-4 py-3 text-zinc-900 dark:text-white outline-none transition-colors shadow-inner" />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">{t("profile.bio")}</label>
                          <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder={t("profile.bioPlaceholder")} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-blue-500 rounded-xl px-4 py-3 text-zinc-900 dark:text-white outline-none transition-colors shadow-inner resize-none" />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">{t("profile.avatar")}</label>
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 overflow-hidden shrink-0">
                              {selectedImage ? (
                                <img src={URL.createObjectURL(selectedImage)} alt="Preview" className="w-full h-full object-cover" />
                              ) : (
                                <img src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=GameHub`} alt="Avatar" className="w-full h-full object-cover" />
                              )}
                            </div>
                            <input type="file" accept="image/*" onChange={e => e.target.files && setSelectedImage(e.target.files[0])} className="block w-full text-sm text-zinc-600 dark:text-zinc-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-600/10 file:text-blue-400 hover:file:bg-blue-600/20 cursor-pointer transition-colors" />
                          </div>
                        </div>

                        <button type="submit" disabled={saving} className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-zinc-900 dark:text-white rounded-xl font-bold transition-all hover:shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                          {saving ? <div className="w-5 h-5 border-2 border-black/30 dark:border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
                          {saving ? t("profile.saving") : t("profile.saveChanges")}
                        </button>
                      </form>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-white/70 dark:bg-zinc-900/50 border border-white/60 dark:border-zinc-800 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
                      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-purple-400" /> {t("profile.security") || "Security"}
                      </h2>
                      
                      {passwordMessage.text && (
                        <div className={`p-4 rounded-xl mb-6 text-sm font-medium ${passwordMessage.isError ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-green-500/10 border border-green-500/20 text-green-400'}`}>
                          {passwordMessage.text}
                        </div>
                      )}

                      <form onSubmit={handleChangePassword} className="space-y-4">
                        <div>
                          <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required placeholder={t("profile.currentPassword")} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-purple-500 rounded-xl px-4 py-3 text-zinc-900 dark:text-white outline-none transition-colors shadow-inner" />
                        </div>
                        <div>
                          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required placeholder={t("profile.newPassword")} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-purple-500 rounded-xl px-4 py-3 text-zinc-900 dark:text-white outline-none transition-colors shadow-inner" />
                        </div>
                        <div>
                          <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder={t("profile.confirmPassword")} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-purple-500 rounded-xl px-4 py-3 text-zinc-900 dark:text-white outline-none transition-colors shadow-inner" />
                        </div>
                        <button type="submit" disabled={changingPassword} className="w-full py-3.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:bg-zinc-700 disabled:opacity-50 text-zinc-900 dark:text-white rounded-xl font-bold transition-all border border-zinc-300 dark:border-zinc-700">
                          {changingPassword ? "Updating..." : t("profile.changePassword")}
                        </button>
                      </form>
                    </div>

                    {/* Gamification Stats */}
                    <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-orange-500 mb-1">
                            <Flame className="w-4 h-4" />
                            <span className="font-bold">{profile?.loginStreak || 0}</span>
                          </div>
                          <p className="text-xs text-zinc-500 font-medium">Ngày Streak</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-blue-500 mb-1">
                            <Clock className="w-4 h-4" />
                            <span className="font-bold">{Math.floor((profile?.totalPlayTime || 0) / 60)}</span>
                          </div>
                          <p className="text-xs text-zinc-500 font-medium">Phút Chơi</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs font-bold mb-1">
                          <span className="text-yellow-500">LVL {profile?.level || 1}</span>
                          <span className="text-zinc-500">{profile?.xp || 0} XP</span>
                        </div>
                        <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-500 transition-all duration-500" style={{ width: `${(profile?.xp || 0) % 100}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {activeTab === 'uploads' && (
                <div className="bg-white/70 dark:bg-zinc-900/50 border border-white/60 dark:border-zinc-800 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none min-h-[400px]">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                    <h2 className="text-2xl font-bold">{t("profile.myUploads")}</h2>
                    <Link href="/creator/upload" className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors flex items-center gap-2">
                      <UploadCloud className="w-4 h-4" /> {t("profile.uploadNew")}
                    </Link>
                  </div>
                  {uploadedGames.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                      <p>{t("profile.noGamesUploaded")}</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-sm">
                            <th className="py-4 font-medium">{t("profile.game")}</th>
                            <th className="py-4 font-medium">{t("profile.status")}</th>
                            <th className="py-4 font-medium text-right">{t("profile.actions")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {uploadedGames.map(game => (
                            <tr key={game.id} className="border-b border-zinc-200/50 dark:border-zinc-800/50 hover:bg-zinc-100/20 dark:bg-zinc-800/20 transition-colors">
                              <td className="py-4">
                                <div className="flex items-center gap-3">
                                  <img src={game.coverImageUrl || '/placeholder.png'} className="w-12 h-12 rounded-lg object-cover" />
                                  <div>
                                    <p className="font-bold text-zinc-900 dark:text-white">{game.title}</p>
                                    <p className="text-xs text-zinc-500">{new Date(game.createdAt).toLocaleDateString()}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4">
                                <span className={`px-2 py-1 text-xs font-bold rounded ${game.status === 'published' ? 'bg-green-500/10 text-green-500' : game.status === 'rejected' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                  {t(`profile.status_${game.status}`) || game.status}
                                </span>
                              </td>
                              <td className="py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {game.status === 'published' && (
                                    <Link href={`/game/play?id=${game.id}`} className="text-xs font-medium px-3 py-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors">{t("profile.play")}</Link>
                                  )}
                                  <Link href={`/creator/edit/${game.id}`} className="text-xs font-medium px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:bg-zinc-700 rounded-lg transition-colors">{t("profile.edit")}</Link>
                                  <button onClick={() => handleDeleteGame(game.id)} className="text-xs font-medium px-3 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors">{t("profile.delete")}</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      {isCreatorProfileOpen && selectedCreatorId && (
        <CreatorProfileModal
          creatorId={selectedCreatorId}
          isOpen={isCreatorProfileOpen}
          onClose={() => {
            setIsCreatorProfileOpen(false);
            setSelectedCreatorId(null);
          }}
        />
      )}
    </div>
  );
}

