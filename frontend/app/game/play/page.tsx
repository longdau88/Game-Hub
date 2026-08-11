"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Maximize2, Share2, Eye, Loader2, Flag, ShieldAlert, Bookmark } from "lucide-react";
import GameComments from "../../../components/GameComments";
import GameRating from "../../../components/GameRating";
import { useLanguage } from "../../../contexts/LanguageContext";
import Cookies from "js-cookie";

function GamePlayerContent() {
  const { locale: language, t } = useLanguage();
  const searchParams = useSearchParams();
  const gameId = searchParams.get("id");
  
  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reporting, setReporting] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
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
        alert("You must be logged in to report a game.");
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
        alert("Report submitted successfully.");
        setReportModalOpen(false);
        setReportReason("");
      } else {
        alert("Failed to submit report.");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred.");
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
    
    // Fetch game details
    fetch(`${apiUrl}/api/games/${gameId}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) setGame(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
      
    // Fetch Leaderboard
    fetch(`${apiUrl}/api/gamification/leaderboard/${gameId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setLeaderboard(data);
      })
      .catch(console.error);

    // Increment play count
    fetch(`${apiUrl}/api/games/${gameId}/play`, { method: "POST" }).catch(console.error);
    // Check if bookmarked
    const token = Cookies.get("token");
    if (token) {
      fetch(`${apiUrl}/api/games/user/bookmarked`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.some(g => g.id === gameId)) {
          setIsBookmarked(true);
        }
      })
      .catch(console.error);
    }
  }, [gameId]);

  const handleBookmark = async () => {
    const token = Cookies.get("token");
    if (!token) {
      alert("Vui lòng đăng nhập để lưu game.");
      return;
    }
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/games/${gameId}/bookmark`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (res.ok) {
        setIsBookmarked(!isBookmarked);
        // Optimistically update the save count
        setGame((prev: any) => ({
          ...prev,
          saveCount: isBookmarked ? Math.max(0, (prev.saveCount || 0) - 1) : (prev.saveCount || 0) + 1
        }));
      }
    } catch (error) {
      console.error(error);
    }
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
        <p className="text-zinc-400 mb-8">The game you are looking for does not exist or has been removed.</p>
        <Link href="/" className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium">
          {t("game.backToStore")}
        </Link>
      </div>
    );
  }

  const r2PublicUrl = `${process.env.NEXT_PUBLIC_R2_URL}/games/${gameId}/index.html`;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("game.backToStore")}
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-black rounded-xl overflow-hidden border border-zinc-800 shadow-2xl relative group aspect-video">
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
                className="p-2 bg-black/60 hover:bg-black/80 rounded-md backdrop-blur-sm border border-white/10 text-white transition-colors" 
                title="Fullscreen (F11)"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-bold mb-2">{game.title}</h1>
            <div className="flex items-center justify-between gap-4 text-sm text-zinc-400 mb-6 border-b border-zinc-800/50 pb-6">
              <div className="flex items-center gap-4">
                <span>{t("game.publishedOn")} {new Date(game.createdAt).toLocaleDateString()}</span>
                <span>•</span>
                <span className="flex items-center">
                  <Eye className="w-4 h-4 mr-1" />
                  {game.playCount || 0} {t("game.plays")}
                </span>
                <span>•</span>
                <span className="flex items-center">
                  <Bookmark className="w-4 h-4 mr-1 text-zinc-400" />
                  {game.saveCount || 0} {t("game.saves") || "Lượt lưu"}
                </span>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={handleBookmark}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isBookmarked ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} /> 
                  {isBookmarked ? (t("game.saved") || "Đã lưu") : (t("game.save") || "Lưu game")}
                </button>
                <button onClick={() => setReportModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm font-medium transition-colors">
                  <Flag className="w-4 h-4" /> Báo cáo
                </button>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert(t("game.copied"));
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Share2 className="w-4 h-4" /> {t("game.share")}
                </button>
              </div>
            </div>
            
            <div className="mb-8">
              <h3 className="text-sm font-medium text-zinc-400 mb-2">{t("game.rateThisGame")}</h3>
              <GameRating gameId={gameId!} averageRating={game.averageRating} totalRatings={game.totalRatings} />
            </div>
            
            <div>
              <h2 className="text-lg font-semibold mb-3">{t("game.aboutThisGame")}</h2>
              <div className="text-zinc-300 leading-relaxed space-y-4 whitespace-pre-wrap">
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
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h3 className="font-medium text-lg mb-4 text-white">{t("game.controls")}</h3>
            <div className="space-y-3 text-sm text-zinc-400">
              {game.controls && game.controls.length > 0 ? (
                game.controls.map((control: any, index: number) => (
                  <div key={index} className="flex justify-between items-center pb-2 border-b border-zinc-800/50">
                    <span>{control.action}</span>
                    <span className="font-mono bg-zinc-800 px-2 py-1 rounded text-zinc-300">{control.key}</span>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-800/50">
                    <span>{t("game.movement")}</span>
                    <span className="font-mono bg-zinc-800 px-2 py-1 rounded text-zinc-300">W A S D</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-800/50">
                    <span>{t("game.action")}</span>
                    <span className="font-mono bg-zinc-800 px-2 py-1 rounded text-zinc-300">Space</span>
                  </div>
                </>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-4 italic">{t("game.controlsVary")}</p>
          </div>

          <div className="bg-gradient-to-b from-yellow-900/20 to-zinc-900/50 border border-yellow-900/30 rounded-xl p-6 relative overflow-hidden">
            <h3 className="font-medium text-lg mb-4 text-white flex items-center gap-2"><span className="text-yellow-500">🏆</span> Leaderboard</h3>
            <div className="space-y-3">
              {leaderboard.length === 0 ? (
                <p className="text-sm text-zinc-500 italic">No scores yet. Be the first!</p>
              ) : (
                leaderboard.map((entry, index) => (
                  <div key={entry.id} className="flex justify-between items-center p-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${index === 0 ? 'bg-yellow-500 text-black' : index === 1 ? 'bg-zinc-300 text-black' : index === 2 ? 'bg-amber-700 text-white' : 'bg-zinc-700 text-zinc-400'}`}>
                        {index + 1}
                      </div>
                      <div className="flex items-center gap-2">
                        {entry.user.avatarUrl ? <img src={entry.user.avatarUrl} alt="" className="w-6 h-6 rounded-full" /> : <div className="w-6 h-6 bg-zinc-700 rounded-full"></div>}
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
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">Report Game</h3>
              <p className="text-sm text-zinc-400 mb-4">
                Please describe the issue with this game (e.g., broken file, inappropriate content, etc.)
              </p>
              
              <form onSubmit={handleReport}>
                <textarea
                  required
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Reason for reporting..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-red-500 resize-none h-32 mb-6"
                />
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setReportModalOpen(false)}
                    className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!reportReason.trim() || reporting}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {reporting ? "Submitting..." : "Submit Report"}
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
