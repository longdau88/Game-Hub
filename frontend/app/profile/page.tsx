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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [message, setMessage] = useState({ text: "", isError: false });

  useEffect(() => {
    fetchProfile();
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: "", isError: false });

    const token = Cookies.get("token");
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/users/me`, {
        method: "PUT",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, avatarUrl })
      });
      
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: "Profile updated successfully!", isError: false });
        setProfile({ ...profile, username, avatarUrl });
      } else {
        setMessage({ text: data.error || "Failed to update profile", isError: true });
      }
    } catch (error) {
      setMessage({ text: "Network error", isError: true });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20 text-zinc-400">Loading profile...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-4 bg-blue-600/20 rounded-2xl">
          <User className="w-8 h-8 text-blue-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-zinc-400">Manage your account and view stats</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Profile Settings */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 md:p-8">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-400" /> General Settings
            </h2>
            
            {message.text && (
              <div className={`p-4 rounded-lg mb-6 ${message.isError ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-green-500/10 border border-green-500/20 text-green-400'}`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Email Address</label>
                <input 
                  type="email" 
                  value={profile?.email} 
                  disabled
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-500 cursor-not-allowed" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Display Name</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-3 text-white transition-colors" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Avatar URL</label>
                <div className="flex gap-4 items-start">
                  <div className="w-16 h-16 rounded-full bg-zinc-800 flex-shrink-0 border border-zinc-700 overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 m-4 text-zinc-500" />
                    )}
                  </div>
                  <input 
                    type="url" 
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.png"
                    className="flex-1 bg-zinc-900 border border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-3 text-white transition-colors mt-2" 
                  />
                </div>
                <p className="text-xs text-zinc-500 mt-2">Paste a link to an image to use as your avatar.</p>
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div>
          {/* Stats Widget */}
          <div className="bg-gradient-to-b from-blue-900/20 to-zinc-900/50 border border-blue-900/30 rounded-2xl p-6 relative overflow-hidden">
            <h2 className="text-lg font-semibold mb-6">Your Stats</h2>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-xl">
                  <Gamepad2 className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-zinc-400 text-sm">Uploaded Games</p>
                  <p className="text-2xl font-bold">{profile?.stats?.uploadedGames || 0}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500/10 rounded-xl">
                  <Play className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-zinc-400 text-sm">Total Plays</p>
                  <p className="text-2xl font-bold">{profile?.stats?.totalPlays || 0}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-zinc-800/50">
              <button 
                onClick={() => router.push('/creator')}
                className="w-full text-center py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-medium transition-colors"
              >
                Go to Creator Hub
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
