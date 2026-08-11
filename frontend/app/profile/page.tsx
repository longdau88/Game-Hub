"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { User, Settings, Gamepad2, Play, Save, History, Bookmark, UploadCloud, ShieldAlert, Star } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function ProfilePage() {
  const router = useRouter();
  const { locale: language, t } = useLanguage();
  
  const [activeTab, setActiveTab] = useState("settings");
  
  const [profile, setProfile] = useState<any>(null);
  const [uploadedGames, setUploadedGames] = useState<any[]>([]);
  const [gameHistory, setGameHistory] = useState<any[]>([]);
  const [bookmarkedGames, setBookmarkedGames] = useState<any[]>([]);
  
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
    fetchGameHistory();
    fetchBookmarkedGames();
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

  const fetchGameHistory = async () => {
    if (!Cookies.get("token")) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/games/user/history`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setGameHistory(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchBookmarkedGames = async () => {
    if (!Cookies.get("token")) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/games/user/bookmarked`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setBookmarkedGames(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteGame = async (gameId: string) => {
    if (!confirm(t("profile.confirmDelete"))) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/games/${gameId}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (res.ok) {
        alert(t("profile.deleteSuccess"));
        setUploadedGames(uploadedGames.filter(g => g.id !== gameId));
        fetchProfile();
      } else {
        const data = await res.json();
        alert(data.error || t("profile.deleteError"));
      }
    } catch (error) {
      alert(t("profile.deleteError"));
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
        alert(t("profile.success")); 
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
        alert(data.message);
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
    <div className="group relative flex items-center gap-4 bg-zinc-900/50 hover:bg-zinc-800/80 border border-zinc-800 p-3 rounded-2xl transition-all duration-300">
      <Link href={`/game/play?id=${game.id}`} className="w-24 h-24 aspect-square rounded-xl overflow-hidden relative shrink-0 border border-white/5">
        <img src={game.coverImageUrl || '/placeholder.png'} alt={game.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-8 h-8 rounded-full bg-blue-600/90 flex items-center justify-center text-white shadow-lg backdrop-blur-sm">
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </div>
        </div>
      </Link>
      <div className="flex-1 py-1">
        <Link href={`/game/play?id=${game.id}`}>
          <h3 className="font-bold text-white text-lg group-hover:text-blue-400 transition-colors line-clamp-1">{game.title}</h3>
        </Link>
        <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1.5 mt-1">
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
        <div className="relative mb-12 rounded-[2rem] overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-blue-900/40 via-purple-900/40 to-blue-900/40" />
          <div className="relative z-10 px-8 pb-8 pt-20 flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-zinc-900 bg-zinc-800 shadow-xl shrink-0">
              <img src={profile?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.username}`} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-black text-white tracking-tight mb-1">{profile?.username || "Player"}</h1>
              <p className="text-zinc-400 text-sm mb-3 flex items-center justify-center md:justify-start gap-2">
                <ShieldAlert className="w-4 h-4" /> {t("profile.role")}: <span className="text-white capitalize">{profile?.role}</span>
              </p>
              <p className="text-zinc-300 max-w-xl">{profile?.bio || t("profile.noBio")}</p>
            </div>
            <div className="flex gap-4">
              <div className="text-center px-4 py-2 bg-black/40 rounded-xl border border-white/5">
                <p className="text-2xl font-bold text-white">{gameHistory.length}</p>
                <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">{t("profile.gamesPlayed")}</p>
              </div>
              <div className="text-center px-4 py-2 bg-black/40 rounded-xl border border-white/5">
                <p className="text-2xl font-bold text-blue-400">{uploadedGames.length}</p>
                <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">{t("profile.myUploads")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-8 bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-800 w-fit mx-auto">
          {[
            { id: 'settings', icon: Settings, label: t("profile.tabSettings") },
            { id: 'history', icon: History, label: t("profile.tabHistory") },
            { id: 'bookmarks', icon: Bookmark, label: t("profile.tabBookmarks") },
            { id: 'uploads', icon: UploadCloud, label: t("profile.myUploads") }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id 
                  ? 'bg-zinc-800 text-white shadow-md' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
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
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 md:p-8 backdrop-blur-xl">
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
                          <label className="block text-sm font-medium text-zinc-400 mb-2">{t("profile.email")}</label>
                          <input type="email" value={profile?.email || ""} disabled className="w-full bg-black/40 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-500 cursor-not-allowed" />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-zinc-400 mb-2">{t("profile.username")}</label>
                          <input type="text" value={username} onChange={e => setUsername(e.target.value)} required className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 rounded-xl px-4 py-3 text-white outline-none transition-colors shadow-inner" />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-zinc-400 mb-2">{t("profile.bio")}</label>
                          <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder={t("profile.bioPlaceholder")} className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 rounded-xl px-4 py-3 text-white outline-none transition-colors shadow-inner resize-none" />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-zinc-400 mb-2">{t("profile.avatar")}</label>
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl bg-zinc-800 border border-zinc-700 overflow-hidden shrink-0">
                              {selectedImage ? (
                                <img src={URL.createObjectURL(selectedImage)} alt="Preview" className="w-full h-full object-cover" />
                              ) : (
                                <img src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`} alt="Avatar" className="w-full h-full object-cover" />
                              )}
                            </div>
                            <input type="file" accept="image/*" onChange={e => e.target.files && setSelectedImage(e.target.files[0])} className="block w-full text-sm text-zinc-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-600/10 file:text-blue-400 hover:file:bg-blue-600/20 cursor-pointer transition-colors" />
                          </div>
                        </div>

                        <button type="submit" disabled={saving} className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-bold transition-all hover:shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                          {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
                          {saving ? t("profile.saving") : t("profile.saveChanges")}
                        </button>
                      </form>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 md:p-8 backdrop-blur-xl">
                      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-purple-400" /> Security
                      </h2>
                      
                      {passwordMessage.text && (
                        <div className={`p-4 rounded-xl mb-6 text-sm font-medium ${passwordMessage.isError ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-green-500/10 border border-green-500/20 text-green-400'}`}>
                          {passwordMessage.text}
                        </div>
                      )}

                      <form onSubmit={handleChangePassword} className="space-y-4">
                        <div>
                          <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required placeholder={t("profile.currentPassword")} className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-xl px-4 py-3 text-white outline-none transition-colors shadow-inner" />
                        </div>
                        <div>
                          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required placeholder={t("profile.newPassword")} className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-xl px-4 py-3 text-white outline-none transition-colors shadow-inner" />
                        </div>
                        <div>
                          <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder={t("profile.confirmPassword")} className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-xl px-4 py-3 text-white outline-none transition-colors shadow-inner" />
                        </div>
                        <button type="submit" disabled={changingPassword} className="w-full py-3.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white rounded-xl font-bold transition-all border border-zinc-700">
                          {changingPassword ? "Updating..." : t("profile.changePassword")}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 md:p-8 backdrop-blur-xl min-h-[400px]">
                  <h2 className="text-2xl font-bold mb-6">{t("profile.recentlyPlayed")}</h2>
                  {gameHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
                      <History className="w-16 h-16 mb-4 opacity-20" />
                      <p>{t("profile.noHistory")}</p>
                      <Link href="/" className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-medium transition-colors">{t("profile.playGames")}</Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {gameHistory.map(game => <GameListCard key={game.id} game={game} type="history" />)}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'bookmarks' && (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 md:p-8 backdrop-blur-xl min-h-[400px]">
                  <h2 className="text-2xl font-bold mb-6">{t("profile.savedGames")}</h2>
                  {bookmarkedGames.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
                      <Bookmark className="w-16 h-16 mb-4 opacity-20" />
                      <p>{t("profile.noBookmarks")}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {bookmarkedGames.map(game => <GameListCard key={game.id} game={game} type="bookmark" />)}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'uploads' && (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 md:p-8 backdrop-blur-xl min-h-[400px]">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">{t("profile.myUploads")}</h2>
                    <Link href="/creator/upload" className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors flex items-center gap-2">
                      <UploadCloud className="w-4 h-4" /> {t("profile.uploadNew")}
                    </Link>
                  </div>
                  {uploadedGames.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500 border border-dashed border-zinc-800 rounded-2xl">
                      <p>{t("profile.noGamesUploaded")}</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-zinc-800 text-zinc-400 text-sm">
                            <th className="py-4 font-medium">{t("profile.game")}</th>
                            <th className="py-4 font-medium">{t("profile.status")}</th>
                            <th className="py-4 font-medium text-right">{t("profile.actions")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {uploadedGames.map(game => (
                            <tr key={game.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                              <td className="py-4">
                                <div className="flex items-center gap-3">
                                  <img src={game.coverImageUrl || '/placeholder.png'} className="w-12 h-12 rounded-lg object-cover" />
                                  <div>
                                    <p className="font-bold text-white">{game.title}</p>
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
                                  <Link href={`/game/edit/${game.id}`} className="text-xs font-medium px-3 py-1.5 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded-lg transition-colors">{t("profile.edit")}</Link>
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
    </div>
  );
}
