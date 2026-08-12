"use client";

import { useState, useEffect } from "react";
import { Ban } from "lucide-react";
import Cookies from "js-cookie";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function AdminUsersPage() {
  const { t } = useLanguage();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const token = Cookies.get("token");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setUsers(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const toggleBan = async (id: number, currentStatus: boolean) => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/users/${id}/ban`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ isBanned: !currentStatus }),
      });
      if (res.ok) fetchData();
    } catch (error) { console.error(error); }
  };

  const toggleRole = async (id: number, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    try {
      const res = await fetch(`${apiUrl}/api/admin/users/${id}/role`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) fetchData();
    } catch (error) { console.error(error); }
  };

  if (loading) return <div className="flex flex-col items-center justify-center py-20 text-zinc-500 dark:text-zinc-400"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div><p className="font-medium">{t("common.loading") || "Đang tải..."}</p></div>;

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (user.username && user.username.toLowerCase().includes(query)) || 
           (user.email && user.email.toLowerCase().includes(query));
  });

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-border bg-muted/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="font-semibold">{t("admin.tabUsers")}</h3>
        <input 
          type="text" 
          placeholder={t("admin.searchUsersPlaceholder") || "Search by username or email..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-3 py-1.5 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-none focus:border-blue-500 w-full sm:w-64"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/30 border-b border-border">
            <tr>
              <th className="p-4 font-medium text-zinc-600 dark:text-zinc-400">{t("admin.colUsername")}</th>
              <th className="p-4 font-medium text-zinc-600 dark:text-zinc-400">{t("admin.colEmail")}</th>
              <th className="p-4 font-medium text-zinc-600 dark:text-zinc-400">{t("admin.colRole")}</th>
              <th className="p-4 font-medium text-zinc-600 dark:text-zinc-400">{t("admin.colGames")}</th>
              <th className="p-4 font-medium text-zinc-600 dark:text-zinc-400">{t("admin.colStatus")}</th>
              <th className="p-4 font-medium text-zinc-600 dark:text-zinc-400">{t("admin.colActions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-muted/20">
                <td className="p-4 font-medium">{user.username || "â€”"}</td>
                <td className="p-4 text-zinc-600 dark:text-zinc-400">{user.email}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${user.role === "admin" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700"}`}>
                    {user.role}
                  </span>
                </td>
                <td className="p-4 text-zinc-600 dark:text-zinc-400">{user.gamesUploaded ?? 0}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${user.isBanned ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-green-500/10 text-green-400 border border-green-500/20"}`}>
                    {user.isBanned ? t("admin.banned") : t("admin.active")}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleRole(user.id, user.role)}
                      className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded text-xs transition-colors"
                    >
                      {user.role === "admin" ? t("admin.makeUser") : t("admin.makeAdmin")}
                    </button>
                    <button
                      onClick={() => toggleBan(user.id, user.isBanned)}
                      className={`p-1.5 rounded transition-colors ${user.isBanned ? "bg-green-500/10 hover:bg-green-500/20 text-green-500" : "bg-red-500/10 hover:bg-red-500/20 text-red-500"}`}
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-zinc-500">No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

