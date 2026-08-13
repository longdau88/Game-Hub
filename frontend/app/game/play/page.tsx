"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Maximize2, Share2, Eye, Loader2, Flag, ShieldAlert, Bookmark, UserPlus, UserCheck, ChevronDown, Folder } from "lucide-react";
import GameComments from "../../../components/GameComments";
import GameRating from "../../../components/GameRating";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useAppDialog } from "../../../contexts/DialogContext";
import Cookies from "js-cookie";

function GamePlayerContent() {
  const { locale: language, t } = useLanguage();
  const { notify } = useAppDialog();
  const searchParams = useSearchParams();
  const gameId = searchParams.get("id");
  
  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reporting, setReporting] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [followingCreator, setFollowingCreator] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [leaderboardFilter, setLeaderboardFilter] = useState<'global' | 'friends'>('global');
  const [collections, setCollections] = useState<any[]>([]);
  const [showCollections, setShowCollections] = useState(false);
  const [currentCollectionId, setCurrentCollectionId] = useState<number | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const sessionLogged = useRef<boolean>(false);
  
  const sessionStartTime = useRef<number>(Date.now());

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      iframeRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F11") {
        e.preventDefault(); // Prevent browser default F11 fullscreen
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    
    // Telemetry: Catch iframe messages if game supports it
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'CRASH') {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        fetch(`${apiUrl}/api/games/${gameId}/crash`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            errorMsg: e.data.error || 'Unknown iframe crash',
            stackTrace: e.data.stack || '',
            browserInfo: navigator.userAgent
          })
        }).catch(console.error);
      }
    };
    window.addEventListener('message', handleMessage);

    // Telemetry: Log Session Length on Unload
    const logSessionTelemetry = () => {
      if (sessionLogged.current || !gameId) return;
      sessionLogged.current = true;
      const lengthSeconds = Math.round((Date.now() - sessionStartTime.current) / 1000);
      if (lengthSeconds > 5) { // Only log if they played for at least 5 seconds
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const url = `${apiUrl}/api/games/${gameId}/session`;
        const data = JSON.stringify({ sessionLength: lengthSeconds });
        
        const token = Cookies.get("token");
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        fetch(url, {
          method: 'POST',
          headers,
          body: data,
          keepalive: true
        }).catch(console.error);
      }
    };

    window.addEventListener('beforeunload', logSessionTelemetry);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('beforeunload', logSessionTelemetry);
      logSessionTelemetry(); // Log when component unmounts (navigating away)
    };
  }, [gameId]);

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason.trim()) return;
    
    setReporting(true);
    try {
      const token = Cookies.get("token");
      if (!token) {
        await notify({ message: t("dialog.loginRequired"), variant: "info" });
        setReporting(false);
        return;
      }
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/reports`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ gameId, reason: reportReason })
      });
      
      if (res.ok) {
        await notify({ message: t("game.reportSuccess"), variant: "success" });
        setReportModalOpen(false);
        setReportReason("");
      } else {
        await notify({ message: t("game.reportError"), variant: "error" });
      }
    } catch (error) {
      console.error(error);
      await notify({ message: t("dialog.genericError"), variant: "error" });
    } finally {
      setReporting(false);
    }
  };

  useEffect(() => {
    if (!gameId) {
      setLoading(false);
      return;
    }
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const token = Cookies.get("token");
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    // Fetch game details
    fetch(`${apiUrl}/api/games/${gameId}`, { headers })
      .then(res => res.json())
      .then(data => {
        if (!data.error) { setGame(data); setFollowingCreator(Boolean(data.followingCreator)); }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
      
    // Initial Fetch Leaderboard
    fetchLeaderboard('global', headers);

    // Increment play count
    fetch(`${apiUrl}/api/games/${gameId}/play`, { method: "POST", headers }).catch(console.error);
    
    // Check if bookmarked
    if (token) {
      fetch(`${apiUrl}/api/games/user/bookmarked`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const bGame = data.find(g => g.id === gameId);
          if (bGame) {
            setIsBookmarked(true);
            setCurrentCollectionId(bGame.collectionId || null);
          }
        }
      })
      .catch(console.error);

      // Fetch collections
      fetch(`${apiUrl}/api/collections`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCollections(data);
      })
      .catch(console.error);
    }
  }, [gameId]);

  const fetchLeaderboard = (filter: 'global' | 'friends', specificHeaders?: HeadersInit) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    let headers = specificHeaders;
    if (!headers) {
      headers = { "Content-Type": "application/json" };
      const token = Cookies.get("token");
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }
    
    const filterParam = filter === 'friends' ? '?filter=friends' : '';
    fetch(`${apiUrl}/api/gamification/leaderboard/${gameId}${filterParam}`, { headers })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setLeaderboard(data);
      })
      .catch(console.error);
  };

  const handleLeaderboardFilterChange = (newFilter: 'global' | 'friends') => {
    if (newFilter === 'friends' && !Cookies.get('token')) {
      notify({ message: t("dialog.loginRequired"), variant: "info" });
      return;
    }
    setLeaderboardFilter(newFilter);
    fetchLeaderboard(newFilter);
  };

  const handleBookmark = async (collectionId?: number | null) => {
    const token = Cookies.get("token");
    if (!token) {
      await notify({ message: t("dialog.loginRequired"), variant: "info" });
      return;
    }
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const bodyPayload = collectionId !== undefined ? { collectionId } : {};
      
      const res = await fetch(`${apiUrl}/api/games/${gameId}/bookmark`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload)
      });
      
      if (res.ok) {
        const data = await res.json();
        setIsBookmarked(data.bookmarked);
        if (data.bookmarked) {
          setCurrentCollectionId(data.collectionId || null);
        } else {
          setCurrentCollectionId(null);
        }
        setShowCollections(false);
        // Optimistically update the save count
        if (data.message === 'Bookmark added') {
          setGame((prev: any) => ({ ...prev, saveCount: (prev.saveCount || 0) + 1 }));
        } else if (data.message === 'Bookmark removed') {
          setGame((prev: any) => ({ ...prev, saveCount: Math.max(0, (prev.saveCount || 0) - 1) }));
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleFollowCreator = async () => {
    const token = Cookies.get("token");
    if (!token) { await notify({ message: t("dialog.loginRequired"), variant: "info" }); return; }
    if (!game?.uploader?.id) return;
    setFollowLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${apiUrl}/api/users/${game.uploader.id}/follow`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const result = await response.json();
      if (response.ok) {
        setFollowingCreator(result.following);
        await notify({ message: result.following ? t("creator.followSuccess") : t("creator.unfollowSuccess"), variant: "success" });
      } else await notify({ message: t("dialog.genericError"), variant: "error" });
    } catch (error) { console.error(error); await notify({ message: t("dialog.genericError"), variant: "error" }); }
    finally { setFollowLoading(false); }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-24 flex justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-3xl font-bold mb-4">Game Not Found</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">The game you are looking for does not exist or has been removed.</p>
        <Link href="/" className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-zinc-900 dark:text-white font-medium">
          {t("game.backToStore")}
        </Link>
      </div>
    );
  }

  const r2PublicUrl = `${process.env.NEXT_PUBLIC_R2_URL}/games/${gameId}/index.html`;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-white transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("game.backToStore")}
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-black rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-2xl relative group aspect-video">
            <iframe
              ref={iframeRef}
              src={r2PublicUrl}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-popups"
              allow="fullscreen"
              title={game.title}
            />
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <button 
                onClick={toggleFullscreen}
                className="p-2 bg-black/60 hover:bg-black/80 rounded-md backdrop-blur-sm border border-black/10 dark:border-white/10 text-zinc-900 dark:text-white transition-colors" 
                title="Fullscreen (F11)"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-bold mb-2">{game.title}</h1>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm text-zinc-600 dark:text-zinc-400 mb-6 border-b border-zinc-200/50 dark:border-zinc-800/50 pb-6">
              <div className="flex flex-wrap items-center gap-4">
                <span>{t("game.publishedOn")} {new Date(game.createdAt).toLocaleDateString()}</span>
                <span>•</span>
                <span className="flex items-center">
                  <Eye className="w-4 h-4 mr-1" />
                  {game.playCount || 0} {t("game.plays")}
                </span>
                <span>•</span>
                <span className="flex items-center">
                  <Bookmark className="w-4 h-4 mr-1 text-zinc-600 dark:text-zinc-400" />
                  {game.saveCount || 0} {t("game.saves") || "Lượt lưu"}
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                {game.uploader && <button onClick={handleFollowCreator} disabled={followLoading} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${followingCreator ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25" : "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700"}`}>
                  {followingCreator ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />} {followingCreator ? t("creator.following") : t("creator.follow")}
                </button>}
                <div className="relative">
                  <button 
                    onClick={() => handleBookmark(currentCollectionId)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isBookmarked ? 'bg-blue-600 text-zinc-900 dark:text-white hover:bg-blue-500' : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white'
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} /> 
                    {isBookmarked ? (t("game.saved") || "Đã lưu") : (t("game.save") || "Lưu game")}
                    {isBookmarked && (
                      <div 
                        className="ml-1 pl-2 border-l border-black/10 dark:border-white/20 hover:text-white"
                        onClick={(e) => { e.stopPropagation(); setShowCollections(!showCollections); }}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                  
                  {showCollections && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden">
                      <div className="p-2">
                        <p className="text-xs font-semibold text-zinc-500 mb-2 px-2">Lưu vào thư mục</p>
                        <button 
                          onClick={() => handleBookmark(null)}
                          className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center justify-between ${currentCollectionId === null ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}
                        >
                          <span className="flex items-center gap-2"><Folder className="w-4 h-4" /> Mặc định</span>
                        </button>
                        {collections.map(c => (
                          <button 
                            key={c.id}
                            onClick={() => handleBookmark(c.id)}
                            className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center justify-between mt-1 ${currentCollectionId === c.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}
                          >
                            <span className="flex items-center gap-2 truncate"><Folder className="w-4 h-4" /> {c.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button onClick={() => setReportModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm font-medium transition-colors">
                  <Flag className="w-4 h-4" /> Báo cáo
                </button>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    void notify({ message: t("game.copied"), variant: "success" });
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Share2 className="w-4 h-4" /> {t("game.share")}
                </button>
              </div>
            </div>
            
            <div className="mb-8">
              <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">{t("game.rateThisGame")}</h3>
              <GameRating gameId={gameId!} averageRating={game.averageRating} totalRatings={game.totalRatings} />
            </div>
            
            <div>
              <h2 className="text-lg font-semibold mb-3">{t("game.aboutThisGame")}</h2>
              <div className="text-zinc-700 dark:text-zinc-300 leading-relaxed space-y-4 whitespace-pre-wrap">
                {(game.descriptionTranslations?.[language] || game.description) ? (
                  <p>{game.descriptionTranslations?.[language] || game.description}</p>
                ) : (
                  <p className="italic text-zinc-500">{t("game.noDescription")}</p>
                )}
              </div>
            </div>
            
            <GameComments gameId={gameId!} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white/70 dark:bg-zinc-900/50 border border-white/60 dark:border-zinc-800 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none backdrop-blur-xl">
            <h3 className="font-medium text-lg mb-4 text-zinc-900 dark:text-white">{t("game.controls")}</h3>
            <div className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
              {game.controls && game.controls.length > 0 ? (
                game.controls.map((control: any, index: number) => (
                  <div key={index} className="flex justify-between items-center pb-2 border-b border-zinc-200/50 dark:border-zinc-800/50">
                    <span>{control.action}</span>
                    <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-zinc-700 dark:text-zinc-300">{control.key}</span>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-200/50 dark:border-zinc-800/50">
                    <span>{t("game.movement")}</span>
                    <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-zinc-700 dark:text-zinc-300">W A S D</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-200/50 dark:border-zinc-800/50">
                    <span>{t("game.action")}</span>
                    <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-zinc-700 dark:text-zinc-300">Space</span>
                  </div>
                </>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-4 italic">{t("game.controlsVary")}</p>
          </div>

          <div className="bg-white/70 dark:bg-zinc-900/50 border border-yellow-500/20 dark:border-yellow-900/30 rounded-2xl p-6 relative overflow-hidden shadow-[0_8px_30px_rgb(234,179,8,0.08)] dark:shadow-none backdrop-blur-xl">
            <div className="flex flex-col gap-3 mb-4">
              <h3 className="font-medium text-lg text-zinc-900 dark:text-white flex items-center gap-2"><span className="text-yellow-500">🏆</span> {t("game.leaderboard")}</h3>
              <div className="flex bg-zinc-200 dark:bg-zinc-800 p-1 rounded-lg">
                <button
                  onClick={() => handleLeaderboardFilterChange('global')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${leaderboardFilter === 'global' ? 'bg-white dark:bg-zinc-700 shadow text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'}`}
                >
                  Toàn cầu
                </button>
                <button
                  onClick={() => handleLeaderboardFilterChange('friends')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${leaderboardFilter === 'friends' ? 'bg-white dark:bg-zinc-700 shadow text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'}`}
                >
                  Bạn bè
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {leaderboard.length === 0 ? (
                <p className="text-sm text-zinc-500 italic">{t("game.noScores")}</p>
              ) : (
                leaderboard.map((entry, index) => (
                  <div key={entry.id} className="flex justify-between items-center p-2 rounded-lg bg-zinc-100/50 dark:bg-zinc-800/50 border border-zinc-300/50 dark:border-zinc-700/50">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${index === 0 ? 'bg-yellow-500 text-black' : index === 1 ? 'bg-zinc-300 text-black' : index === 2 ? 'bg-amber-700 text-zinc-900 dark:text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'}`}>
                        {index + 1}
                      </div>
                      <div className="flex items-center gap-2">
                        {entry.user.avatarUrl ? <img src={entry.user.avatarUrl} alt="" className="w-6 h-6 rounded-full" /> : <div className="w-6 h-6 bg-zinc-200 dark:bg-zinc-700 rounded-full"></div>}
                        <span className="text-sm font-medium">{entry.user.username}</span>
                      </div>
                    </div>
                    <span className="font-mono text-yellow-500 font-bold">{entry.score.toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">{t("game.reportTitle") || "Báo cáo Trò chơi"}</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                {t("game.reportDesc") || "Vui lòng mô tả vấn đề..."}
              </p>
              
              <form onSubmit={handleReport}>
                <textarea
                  required
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Reason for reporting..."
                  className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg p-3 text-zinc-900 dark:text-white focus:outline-none focus:border-red-500 resize-none h-32 mb-6"
                />
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setReportModalOpen(false)}
                    className="flex-1 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:bg-zinc-700 rounded-lg font-medium transition-colors"
                  >
                    {t("dialog.cancel") || "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={!reportReason.trim() || reporting}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-zinc-900 dark:text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {reporting ? (t("common.loading") || "Submitting...") : (t("dialog.confirm") || "Submit Report")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GamePlayer() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">Loading...</div>}>
      <GamePlayerContent />
    </Suspense>
  );
}

