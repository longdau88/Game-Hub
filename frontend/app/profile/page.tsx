"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { User, Settings, Gamepad2, Play, Save } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<any>(null);
  const [uploadedGames, setUploadedGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
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

  const fetchProfile = async () => {
    const token = Cookies.get("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/users/me`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setUsername(data.username);
        setAvatarUrl(data.avatarUrl || "");
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
    const token = Cookies.get("token");
    if (!token) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/games/creator/games`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUploadedGames(data);
      }
    } catch (error) {
      console.error("Failed to fetch uploaded games", error);
    }
  };

  const handleDeleteGame = async (gameId: string) => {
    if (!confirm(t("profile.confirmDelete"))) return;
    
    const token = Cookies.get("token");
    if (!token) return;
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/games/${gameId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (res.ok) {
        alert(t("profile.deleteSuccess"));
        setUploadedGames(uploadedGames.filter(g => g.id !== gameId));
        fetchProfile(); // update stats
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

        const imgbbRes = await fetch("https://api.imgbb.com/1/upload", {
          method: "POST",
          body: formData
        });

        const imgbbData = await imgbbRes.json();
        
        if (imgbbData.success) {
          finalAvatarUrl = imgbbData.data.url;
          setAvatarUrl(finalAvatarUrl);
          setSelectedImage(null);
        } else {
          setMessage({ text: "Failed to upload image to Imgbb", isError: true });
          setSaving(false);
          setUploadingAvatar(false);
          return;
        }
      } catch (err) {
        setMessage({ text: "Error uploading image", isError: true });
        setSaving(false);
        setUploadingAvatar(false);
        return;
      } finally {
        setUploadingAvatar(false);
      }
    }

    const token = Cookies.get("token");
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/users/me`, {
        method: "PUT",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, avatarUrl: finalAvatarUrl })
      });
      
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: t("profile.success"), isError: false });
        alert(t("profile.success")); 
        setProfile({ ...profile, username, avatarUrl: finalAvatarUrl });
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
    const token = Cookies.get("token");
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/users/me/password`, {
        method: "PUT",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      
      const data = await res.json();
      if (res.ok) {
        setPasswordMessage({ text: data.message, isError: false });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
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

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl transition-opacity duration-300">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-4 bg-blue-600/20 rounded-2xl">
          <User className="w-8 h-8 text-blue-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">{t("profile.title")}</h1>
          <p className="text-zinc-400">{t("profile.subtitle")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Profile Settings */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 md:p-8">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-400" /> {t("profile.generalSettings")}
            </h2>
            
            {message.text && (
              <div className={`p-4 rounded-lg mb-6 ${message.isError ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-green-500/10 border border-green-500/20 text-green-400'}`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">{t("profile.email")}</label>
                <div className="relative">
                  <input 
                    type="email" 
                    value={profile?.email || ""} 
                    disabled
                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-500 cursor-not-allowed" 
                  />
                  {loading && <div className="absolute inset-0 bg-zinc-800/80 animate-pulse rounded-lg"></div>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">{t("profile.displayName")}</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-3 text-white transition-colors" 
                  />
                  {loading && <div className="absolute inset-0 bg-zinc-800/80 animate-pulse rounded-lg"></div>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">{t("profile.avatarUrl")}</label>
                <div className="flex gap-4 items-start">
                  <div className="w-16 h-16 rounded-full bg-zinc-800 flex-shrink-0 border border-zinc-700 overflow-hidden">
                    {selectedImage ? (
                      <img src={URL.createObjectURL(selectedImage)} alt="Avatar Preview" className="w-full h-full object-cover" />
                    ) : avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 m-4 text-zinc-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input 
                      type="url" 
                      value={avatarUrl}
                      onChange={(e) => {
                        setAvatarUrl(e.target.value);
                        setSelectedImage(null);
                      }}
                      placeholder="https://example.com/avatar.png"
                      className="w-full bg-zinc-900 border border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-3 text-white transition-colors" 
                    />
                    <div className="mt-3">
                      <label className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-block">
                        {t("profile.chooseFile")}
                        <input 
                          type="file" 
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              setSelectedImage(e.target.files[0]);
                              setAvatarUrl("");
                            }
                          }}
                        />
                      </label>
                      <span className="text-xs text-zinc-500 ml-3">{t("profile.maxSize")}</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 mt-2">{t("profile.pasteLink")}</p>
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={saving || uploadingAvatar}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {uploadingAvatar ? t("profile.uploading") : saving ? t("profile.saving") : t("profile.saveChanges")}
                </button>
              </div>
            </form>
          </div>

          {/* Security Settings */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 md:p-8">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-400" /> {t("profile.security")}
            </h2>
            
            {passwordMessage.text && (
              <div className={`p-4 rounded-lg mb-6 ${passwordMessage.isError ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-green-500/10 border border-green-500/20 text-green-400'}`}>
                {passwordMessage.text}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">{t("profile.currentPassword")}</label>
                <input 
                  type="password" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full bg-zinc-900 border border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-3 text-white transition-colors" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">{t("profile.newPassword")}</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full bg-zinc-900 border border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-3 text-white transition-colors" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">{t("profile.confirmPassword")}</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full bg-zinc-900 border border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-3 text-white transition-colors" 
                />
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={changingPassword}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {changingPassword ? t("profile.saving") : t("profile.changePassword")}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div>
          {/* Stats Widget */}
          <div className="bg-gradient-to-b from-blue-900/20 to-zinc-900/50 border border-blue-900/30 rounded-2xl p-6 relative overflow-hidden">
            <h2 className="text-lg font-semibold mb-6">{t("profile.stats")}</h2>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-xl">
                  <Gamepad2 className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-zinc-400 text-sm">{t("profile.uploadedGames")}</p>
                  {loading ? (
                    <div className="h-8 w-16 bg-zinc-800/80 animate-pulse rounded mt-1"></div>
                  ) : (
                    <p className="text-2xl font-bold">{profile?.stats?.uploadedGames || 0}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500/10 rounded-xl">
                  <Play className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-zinc-400 text-sm">{t("profile.totalPlays")}</p>
                  {loading ? (
                    <div className="h-8 w-16 bg-zinc-800/80 animate-pulse rounded mt-1"></div>
                  ) : (
                    <p className="text-2xl font-bold">{profile?.stats?.totalPlays || 0}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-zinc-800/50">
              <button 
                onClick={() => router.push('/creator')}
                className="w-full text-center py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-medium transition-colors"
              >
                {t("profile.goCreatorHub")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Uploaded Games Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">{t("profile.uploadedGames")}</h2>
        
        {uploadedGames.length === 0 ? (
          <div className="text-center py-12 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
            <Gamepad2 className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400">Bạn chưa tải lên game nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {uploadedGames.map((game) => (
              <div key={game.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden group">
                <div className="aspect-video bg-zinc-800 relative overflow-hidden flex items-center justify-center">
                  {game.coverImageUrl ? (
                    <>
                      <img src={game.coverImageUrl} alt={game.title} className="absolute inset-0 w-full h-full object-cover opacity-60" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <Gamepad2 className="w-10 h-10 text-zinc-400 opacity-50 drop-shadow-md" />
                      </div>
                    </>
                  ) : (
                    <Gamepad2 className="w-10 h-10 text-zinc-600" />
                  )}
                  
                  {/* Status badge */}
                  <div className="absolute top-3 right-3 px-2 py-1 rounded text-xs font-medium bg-black/60 backdrop-blur-md text-white border border-white/10">
                    {game.status === 'published' ? 'Đã Xuất Bản' : game.status === 'pending' ? 'Chờ Duyệt' : 'Bị Từ Chối'}
                  </div>
                </div>
                
                <div className="p-5">
                  <h3 className="font-semibold text-lg mb-1 truncate">{game.title}</h3>
                  <p className="text-sm text-zinc-400 mb-4 truncate">{game.description || "Không có mô tả"}</p>
                  
                  {game.status === 'rejected' && game.rejectReason && (
                    <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                      <span className="font-semibold">Lý do từ chối:</span> {game.rejectReason}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/profile/edit-game/${game.id}`)}
                      className="flex-1 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 rounded-lg text-sm font-medium transition-colors border border-blue-500/20"
                    >
                      {t("profile.editGame")}
                    </button>
                    <button
                      onClick={() => handleDeleteGame(game.id)}
                      className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm font-medium transition-colors border border-red-500/20"
                    >
                      {t("profile.deleteGame")}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
