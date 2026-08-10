"use client";

import { useState, useEffect } from "react";
import { Check, X, Play, Settings, LayoutDashboard, Gamepad2, Users, Tags, Trash2, Ban } from "lucide-react";
import Link from "next/link";
import Cookies from "js-cookie";
import { useLanguage } from "../../contexts/LanguageContext";

export default function AdminPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState<any>(null);
  const [pendingGames, setPendingGames] = useState<any[]>([]);
  const [publishedGames, setPublishedGames] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [previewGameId, setPreviewGameId] = useState<string | null>(null);

  const [newCatName, setNewCatName] = useState("");
  const [newCatSlug, setNewCatSlug] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const token = Cookies.get("token");

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      if (activeTab === "dashboard") {
        const res = await fetch(`${apiUrl}/api/admin/stats`, { headers });
        if (res.ok) setStats(await res.json());
      } else if (activeTab === "games") {
        const [pendingRes, publishedRes] = await Promise.all([
          fetch(`${apiUrl}/api/admin/games/pending`, { headers }),
          fetch(`${apiUrl}/api/admin/games/published`, { headers })
        ]);
        if (pendingRes.ok) setPendingGames(await pendingRes.json());
        if (publishedRes.ok) setPublishedGames(await publishedRes.json());
      } else if (activeTab === "users") {
        const res = await fetch(`${apiUrl}/api/admin/users`, { headers });
        if (res.ok) setUsers(await res.json());
      } else if (activeTab === "categories") {
        const res = await fetch(`${apiUrl}/api/categories`, { headers });
        if (res.ok) setCategories(await res.json());
      }
    } catch (error) {
      console.error("Fetch error", error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0 || !bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // --- Game Actions ---
  const approveGame = async (id: string) => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/games/${id}/approve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const rejectGame = async () => {
    if (!selectedGameId) return;
    try {
      const res = await fetch(`${apiUrl}/api/admin/games/${selectedGameId}/reject`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rejectReason })
      });
      if (res.ok) {
        setRejectModalOpen(false);
        setRejectReason("");
        fetchData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const deleteGame = async (id: string) => {
    if (!confirm("Are you sure you want to delete this game permanently? This action removes files from Cloudflare R2.")) return;
    try {
      const res = await fetch(`${apiUrl}/api/admin/games/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  // --- User Actions ---
  const toggleBan = async (id: number, currentStatus: boolean) => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/users/${id}/ban`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isBanned: !currentStatus })
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const toggleRole = async (id: number, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      const res = await fetch(`${apiUrl}/api/admin/users/${id}/role`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  // --- Category Actions ---
  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/api/categories`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newCatName, slug: newCatSlug })
      });
      if (res.ok) {
        setNewCatName("");
        setNewCatSlug("");
        fetchData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const deleteCategory = async (id: number) => {
    try {
      const res = await fetch(`${apiUrl}/api/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchData();
      else alert("Cannot delete category (maybe games are attached)");
    } catch (error) {
      console.error(error);
    }
  };

  const renderTabContent = () => {
    if (loading) return <div className="text-center py-12 text-zinc-500">Loading...</div>;

    switch (activeTab) {
      case "dashboard":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h3 className="text-zinc-500 text-sm font-medium mb-2">Pending Games</h3>
              <p className="text-3xl font-bold text-yellow-500">{stats?.pendingGamesCount || 0}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h3 className="text-zinc-500 text-sm font-medium mb-2">Published Games</h3>
              <p className="text-3xl font-bold text-emerald-500">{stats?.publishedGamesCount || 0}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h3 className="text-zinc-500 text-sm font-medium mb-2">Total Users</h3>
              <p className="text-3xl font-bold text-blue-500">{stats?.totalUsersCount || 0}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h3 className="text-zinc-500 text-sm font-medium mb-2">R2 Storage Est.</h3>
              <p className="text-3xl font-bold text-purple-500">{formatBytes(stats?.totalStorageBytes)}</p>
            </div>
          </div>
        );

      case "games":
        return (
          <div className="space-y-8">
            {/* Pending Section */}
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-border bg-muted/30">
                <h3 className="font-semibold">Pending Approvals</h3>
              </div>
              <div className="p-0">
                {pendingGames.length === 0 ? (
                  <p className="p-6 text-center text-zinc-500">No pending games.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {pendingGames.map(game => (
                      <li key={game.id} className="p-4 flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-semibold">{game.title}</h4>
                          <p className="text-sm text-zinc-500">Size: {formatBytes(Number(game.sizeBytes))} | Uploaded: {new Date(game.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setPreviewGameId(game.id)} className="p-2 border border-blue-500/30 text-blue-500 rounded-md hover:bg-blue-500/10" title="Review via R2 iFrame">
                            <Play className="w-4 h-4" />
                          </button>
                          <button onClick={() => approveGame(game.id)} className="p-2 border border-emerald-500/30 text-emerald-500 rounded-md hover:bg-emerald-500/10" title="Approve">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setSelectedGameId(game.id); setRejectModalOpen(true); }} className="p-2 border border-red-500/30 text-red-500 rounded-md hover:bg-red-500/10" title="Reject (Deletes from R2)">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Published Section */}
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-border bg-muted/30">
                <h3 className="font-semibold">Published Games</h3>
              </div>
              <div className="p-0">
                <ul className="divide-y divide-border">
                  {publishedGames.map(game => (
                    <li key={game.id} className="p-4 flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold">{game.title}</h4>
                      </div>
                      <div className="flex gap-2">
                         <button onClick={() => deleteGame(game.id)} className="px-3 py-1 text-sm border border-red-500/30 text-red-500 rounded-md hover:bg-red-500/10 flex items-center gap-1">
                           <Trash2 className="w-4 h-4" /> Delete
                         </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );

      case "users":
        return (
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="p-4">Username</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Games</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-muted/20">
                    <td className="p-4 font-medium">{user.username}</td>
                    <td className="p-4 text-zinc-500">{user.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-500' : 'bg-blue-500/20 text-blue-500'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">{user.gamesUploaded}</td>
                    <td className="p-4">
                      {user.isBanned ? (
                        <span className="text-red-500 font-medium flex items-center gap-1"><Ban className="w-3 h-3"/> Banned</span>
                      ) : (
                        <span className="text-emerald-500 font-medium">Active</span>
                      )}
                    </td>
                    <td className="p-4 flex items-center justify-end gap-2">
                      <button onClick={() => toggleRole(user.id, user.role)} className="px-3 py-1 text-xs border border-border rounded hover:bg-muted">
                        Make {user.role === 'admin' ? 'User' : 'Admin'}
                      </button>
                      <button onClick={() => toggleBan(user.id, user.isBanned)} className={`px-3 py-1 text-xs border rounded ${user.isBanned ? 'border-emerald-500 text-emerald-500 hover:bg-emerald-500/10' : 'border-red-500 text-red-500 hover:bg-red-500/10'}`}>
                        {user.isBanned ? 'Unban' : 'Ban'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case "categories":
        return (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-4">Add New Category</h3>
              <form onSubmit={addCategory} className="space-y-4">
                <div>
                  <label className="block text-sm mb-1 text-zinc-500">Name</label>
                  <input required value={newCatName} onChange={e => setNewCatName(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-md" placeholder="e.g. Action RPG"/>
                </div>
                <div>
                  <label className="block text-sm mb-1 text-zinc-500">Slug</label>
                  <input required value={newCatSlug} onChange={e => setNewCatSlug(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-md" placeholder="e.g. action-rpg"/>
                </div>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium w-full">Create Category</button>
              </form>
            </div>
            
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-4 border-b border-border bg-muted/30"><h3 className="font-semibold">Categories</h3></div>
              <ul className="divide-y divide-border">
                {categories.map(cat => (
                  <li key={cat.id} className="p-4 flex items-center justify-between">
                    <div>
                      <span className="font-medium">{cat.name}</span>
                      <span className="text-xs text-zinc-500 ml-2">({cat.slug})</span>
                    </div>
                    <button onClick={() => deleteCategory(cat.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-md"><Trash2 className="w-4 h-4"/></button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl flex flex-col md:flex-row gap-8">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 shrink-0">
        <div className="flex items-center gap-3 mb-8 px-2">
          <Settings className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold">Admin Panel</h1>
        </div>
        
        <nav className="space-y-1">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-zinc-500'}`}>
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </button>
          <button onClick={() => setActiveTab('games')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'games' ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-zinc-500'}`}>
            <Gamepad2 className="w-5 h-5" /> Game Manager
          </button>
          <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-zinc-500'}`}>
            <Users className="w-5 h-5" /> User Access
          </button>
          <button onClick={() => setActiveTab('categories')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'categories' ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-zinc-500'}`}>
            <Tags className="w-5 h-5" /> Categories
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0">
        {renderTabContent()}
      </main>

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-xl shadow-2xl p-6">
            <h3 className="text-lg font-bold mb-4">Reject Game</h3>
            <p className="text-sm text-zinc-500 mb-4">Provide a reason for rejection. This game and its files will be permanently deleted from Cloudflare R2 to save space.</p>
            <textarea
              className="w-full bg-background border border-border rounded-md p-3 text-sm mb-4 min-h-[100px] focus:outline-none focus:border-primary"
              placeholder="e.g. Black screen on launch..."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setRejectModalOpen(false)} className="px-4 py-2 rounded-md text-sm font-medium hover:bg-muted">Cancel</button>
              <button onClick={rejectGame} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-md text-sm font-medium">Reject & Delete Files</button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal (Iframe) */}
      {previewGameId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-5xl bg-black rounded-xl overflow-hidden border border-zinc-800 shadow-2xl flex flex-col h-[80vh]">
            <div className="flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800">
              <h3 className="font-bold">Review Mode</h3>
              <button onClick={() => setPreviewGameId(null)} className="p-2 hover:bg-zinc-800 rounded-md text-zinc-400"><X className="w-5 h-5"/></button>
            </div>
            <div className="flex-1 w-full bg-black">
               <iframe 
                 src={`https://pub-xxxx.r2.dev/games/${previewGameId}/index.html`} 
                 className="w-full h-full border-none"
                 sandbox="allow-scripts allow-same-origin"
               />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
