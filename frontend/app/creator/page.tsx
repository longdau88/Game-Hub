"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import { Plus, LayoutDashboard, Clock, CheckCircle2, XCircle, Gamepad2, Loader2 } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";

export default function CreatorHub() {
  const router = useRouter();
  const { t } = useLanguage();
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGames = async () => {
      const token = Cookies.get("token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const res = await fetch(`${apiUrl}/api/games/creator/games`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setGames(data);
        } else {
          router.push("/login");
        }
      } catch (error) {
        console.error("Failed to fetch creator games", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'published': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'processing': return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default: return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'published': return <span className="text-green-500 font-medium">{t("creator.statusPublished")}</span>;
      case 'rejected': return <span className="text-red-500 font-medium">{t("creator.statusRejected")}</span>;
      case 'processing': return <span className="text-blue-500 font-medium">Processing & Uploading...</span>;
      default: return <span className="text-yellow-500 font-medium">{t("creator.statusPending")}</span>;
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20 text-zinc-600 dark:text-zinc-400">Loading your games...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-purple-600/20 rounded-2xl">
            <LayoutDashboard className="w-8 h-8 text-purple-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{t("creator.title")}</h1>
            <p className="text-zinc-600 dark:text-zinc-400">{t("creator.subtitle")}</p>
          </div>
        </div>
        
        <Link 
          href="/creator/upload"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-zinc-900 dark:text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-lg"
        >
          <Plus className="w-5 h-5" />
          {t("creator.uploadNew")}
        </Link>
      </div>

      <div className="bg-white/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
        {games.length === 0 ? (
          <div className="text-center py-20">
            <Gamepad2 className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-zinc-700 dark:text-zinc-300 mb-2">{t("creator.noGames")}</h3>
            <p className="text-zinc-500 mb-6">{t("creator.noGamesDesc")}</p>
            <Link 
              href="/creator/upload"
              className="inline-flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {t("creator.uploadBtn")}
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-100/50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 border-b border-zinc-300 dark:border-zinc-700">
                <tr>
                  <th className="px-6 py-4 font-medium">{t("creator.tableTitle")}</th>
                  <th className="px-6 py-4 font-medium">{t("creator.tableStatus")}</th>
                  <th className="px-6 py-4 font-medium">{t("creator.tablePlays")}</th>
                  <th className="px-6 py-4 font-medium">{t("creator.tableDate")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {games.map((game) => (
                  <tr key={game.id} className="hover:bg-zinc-100/20 dark:bg-zinc-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 border border-zinc-300 dark:border-zinc-700 relative">
                          {game.coverImageUrl ? (
                            <>
                              <img src={game.coverImageUrl} alt={game.title} className="absolute inset-0 w-full h-full object-cover opacity-60" />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                <Gamepad2 className="w-6 h-6 text-zinc-600 dark:text-zinc-400 opacity-50 drop-shadow-md" />
                              </div>
                            </>
                          ) : (
                            <Gamepad2 className="w-6 h-6 text-zinc-500" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-zinc-800 dark:text-zinc-200">{game.title}</div>
                          <div className="text-xs text-zinc-500 mt-1 line-clamp-1">{game.description || t("creator.noDesc")}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(game.status)}
                        {getStatusText(game.status)}
                      </div>
                      {game.status === 'rejected' && game.rejectReason && (
                        <div className="text-xs text-red-400/80 mt-1 mt-1 max-w-xs">{game.rejectReason}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-zinc-700 dark:text-zinc-300">
                      {game.playCount || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                      {new Date(game.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
