import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { MessageSquare, Trash2 } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

export default function GameComments({ gameId }: { gameId: string }) {
  const { t } = useLanguage();
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const token = Cookies.get("token");

  useEffect(() => {
    fetchComments();
    
    // Poll for new comments every 5 seconds
    const intervalId = setInterval(() => {
      fetchComments();
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, [gameId]);

  const fetchComments = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch(`${apiUrl}/api/social/comments/${gameId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (error) {
      console.error("Failed to fetch comments", error);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Please login to comment");
      return;
    }
    if (!newComment.trim()) return;

    setLoading(true);
    setError("");
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/social/comment/${gameId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ content: newComment })
      });
      if (res.ok) {
        setNewComment("");
        fetchComments(); // Refresh list
      } else {
        const data = await res.json();
        setError(data.error || "Failed to post comment");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 mt-6">
      <h3 className="font-medium text-lg mb-4 text-zinc-900 dark:text-white flex items-center gap-2">
        <MessageSquare className="w-5 h-5" />
        {t("game.comments")} ({comments.length})
      </h3>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {token ? (
        <form onSubmit={handlePostComment} className="mb-6 flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t("game.addComment")}
            className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2 text-sm text-zinc-900 dark:text-white outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={loading || !newComment.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-zinc-900 dark:text-white text-sm font-medium rounded-lg disabled:opacity-50"
          >
            {t("game.btnPost")}
          </button>
        </form>
      ) : (
        <div className="mb-6 p-4 bg-zinc-100/50 dark:bg-zinc-800/50 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 text-center">
          {t("game.loginToComment")}
        </div>
      )}

      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-zinc-500 text-sm text-center">{t("game.noComments")}</p>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex-shrink-0 overflow-hidden">
                {comment.user.avatarUrl ? (
                  <img src={comment.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-500 bg-zinc-200 dark:bg-zinc-700">
                    {comment.user.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-zinc-800 dark:text-zinc-200">{comment.user.username}</span>
                  <span className="text-xs text-zinc-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-1">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
