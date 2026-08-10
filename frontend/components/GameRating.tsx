import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { Star } from "lucide-react";

export default function GameRating({ gameId }: { gameId: string }) {
  const [rating, setRating] = useState<number>(0);
  const [hover, setHover] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const token = Cookies.get("token");

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
        setRating(score);
      }
    } catch (error) {
      console.error("Failed to submit rating", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
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
              star <= (hover || rating) ? "fill-yellow-500 text-yellow-500" : "text-zinc-600"
            }`}
          />
        </button>
      ))}
      {rating > 0 && (
        <span className="text-sm text-zinc-400 ml-2">You rated {rating}/5</span>
      )}
    </div>
  );
}
