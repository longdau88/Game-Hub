"use client";

import { useState, useEffect } from "react";
import { Check, X, Play, Settings } from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  const [pendingGames, setPendingGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingGames();
  }, []);

  const fetchPendingGames = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/games/admin/pending');
      if (res.ok) {
        const data = await res.json();
        setPendingGames(data);
      }
    } catch (error) {
      console.error("Failed to fetch pending games", error);
    } finally {
      setLoading(false);
    }
  };

  const approveGame = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:4000/api/games/admin/${id}/approve`, {
        method: 'PUT'
      });
      if (res.ok) {
        // Remove from list
        setPendingGames(prev => prev.filter(game => game.id !== id));
      }
    } catch (error) {
      console.error("Failed to approve game", error);
    }
  };

  const rejectGame = async (id: string) => {
    // In a real app, we would call a reject API to update status or delete
    // For now, let's just remove it from UI state to simulate rejection
    setPendingGames(prev => prev.filter(game => game.id !== id));
    alert("Game rejected. (Simulation)");
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="flex items-center gap-3 mb-8 pb-6 border-b border-zinc-800">
        <Settings className="w-8 h-8 text-blue-500" />
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-zinc-400">Review and manage game submissions</p>
        </div>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-zinc-800 bg-zinc-900/80">
          <h2 className="text-xl font-semibold">Pending Approvals</h2>
        </div>
        
        <div className="p-0">
          {loading ? (
            <div className="text-center py-12 text-zinc-500">Loading pending games...</div>
          ) : pendingGames.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-zinc-500" />
              </div>
              <h3 className="text-lg font-medium text-zinc-300 mb-1">All Caught Up!</h3>
              <p className="text-zinc-500">There are no new games pending approval at this time.</p>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-800/60">
              {pendingGames.map(game => (
                <li key={game.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-zinc-800/30 transition-colors">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{game.title}</h3>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                        Pending
                      </span>
                    </div>
                    <p className="text-sm text-zinc-400 line-clamp-2 max-w-2xl">{game.description || "No description provided."}</p>
                    <div className="text-xs text-zinc-500 pt-2">
                      Submitted on: {new Date(game.createdAt).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 md:border-l md:border-zinc-800 md:pl-6">
                    <Link href={`/game/${game.id}`} className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white border border-blue-500/20 rounded-lg transition-colors" title="Preview Game">
                      <Play className="w-5 h-5" />
                    </Link>
                    <button 
                      onClick={() => approveGame(game.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 rounded-lg transition-colors font-medium text-sm"
                    >
                      <Check className="w-4 h-4" />
                      Approve
                    </button>
                    <button 
                      onClick={() => rejectGame(game.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 rounded-lg transition-colors font-medium text-sm"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
