import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { Star } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

export default function GameRating({ gameId, averageRating = 0, totalRatings = 0 }: { gameId: string, averageRating?: number, totalRatings?: number }) {
  const { t } = useLanguage();
  const [rating, setRating] = useState<number>(0);
  const [hover, setHover] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [localAvg, setLocalAvg] = useState(averageRating);
  const [localTotal, setLocalTotal] = useState(totalRatings);
  const token = Cookies.get("token");

  useEffect(() => {
    setLocalAvg(averageRating);
    setLocalTotal(totalRatings);
  }, [averageRating, totalRatings]);

  useEffect(() => {
    if (token) {
      fetchMyRating();
    }
  }, [gameId, token]);

  const fetchMyRating = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/social/rate/${gameId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.rating) setRating(data.rating);
      }
    } catch (error) {
      console.error("Failed to fetch rating", error);
    }
  };

  const handleRate = async (score: number) => {
    if (!token) {
      alert("Please login to rate games");
      return;
    }

    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/social/rate/${gameId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ score })
      });
      if (res.ok) {
        const data = await res.json();
        setRating(score);
        if (data.averageRating !== undefined) setLocalAvg(data.averageRating);
        if (data.totalRatings !== undefined) setLocalTotal(data.totalRatings);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to submit rating");
      }
    } catch (error) {
      console.error("Failed to submit rating", error);
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center bg-zinc-100/50 dark:bg-zinc-800/50 px-3 py-1.5 rounded-full border border-zinc-300/50 dark:border-zinc-700/50">
          <Star className="w-5 h-5 fill-yellow-500 text-yellow-500 mr-2" />
          <span className="font-bold text-zinc-900 dark:text-white text-lg">{localAvg > 0 ? localAvg.toFixed(1) : "-"}</span>
          <span className="text-zinc-500 text-sm ml-2">({localTotal} {t("game.totalRatings")})</span>
        </div>
      </div>
      
      <div className="flex items-center gap-1 mt-2">
        <span className="text-sm text-zinc-600 dark:text-zinc-400 mr-2">{t("game.rateThisGame")}:</span>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            disabled={loading}
            onClick={() => handleRate(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="p-1 transition-transform hover:scale-110 disabled:opacity-50 focus:outline-none"
          >
            <Star
              className={`w-6 h-6 transition-colors ${
                star <= (hover || rating) ? "fill-blue-500 text-blue-500" : "text-zinc-600"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
