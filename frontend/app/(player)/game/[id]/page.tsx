"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { GameCard, Game } from "@/components/shared/GameCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Play, Heart, BookmarkPlus, Flag, Star, Users, Calendar, Monitor, Smartphone, Keyboard, MessageSquare } from "lucide-react";

export default function GameDetailPage() {
  const params = useParams();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="flex flex-col pb-20">
      
      {/* Hero Banner Area */}
      <div className="relative w-full h-[400px] md:h-[500px] rounded-3xl overflow-hidden mb-8 border border-border">
        <img 
          src="https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=1600&q=80" 
          alt="Game Cover"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Blur overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex gap-6 items-end">
            <div className="w-32 h-32 md:w-48 md:h-48 rounded-2xl overflow-hidden shadow-2xl border-4 border-background shrink-0 relative hidden sm:block">
              <img src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80" alt="Thumbnail" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Badge variant="success" className="bg-success/20 text-success border-success/30">Action</Badge>
                <Badge variant="secondary">Cyberpunk</Badge>
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-foreground drop-shadow-lg">Neon District: Zero</h1>
              <div className="flex items-center gap-4 text-muted-foreground mt-2">
                <div className="flex items-center gap-1.5 hover:text-foreground cursor-pointer transition-colors">
                  <Avatar size="sm" fallback="N" src="https://api.dicebear.com/7.x/avataaars/svg?seed=NeonStudios" />
                  <span className="font-semibold">NeonStudios</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1 text-amber-500 font-bold">
                  <Star className="w-4 h-4 fill-amber-500" /> 4.9
                </div>
                <span>•</span>
                <span className="flex items-center gap-1"><Users className="w-4 h-4" /> 154K Plays</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
            <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg rounded-2xl shadow-lg shadow-primary/30">
              <Play className="w-6 h-6 mr-2 fill-current" /> Play Game
            </Button>
            <div className="flex gap-3 w-full sm:w-auto">
              <Button size="icon" variant="glass" className="h-14 w-14 rounded-2xl">
                <Heart className="w-6 h-6" />
              </Button>
              <Button size="icon" variant="glass" className="h-14 w-14 rounded-2xl">
                <BookmarkPlus className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mt-8">
        {/* Main Content (Left) */}
        <div className="lg:col-span-2 space-y-12">
          
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">About This Game</h2>
            <div className="prose prose-zinc dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
              <p>
                Dive into the neon-lit streets of the future in Neon District: Zero. This action-packed cyberpunk platformer features stunning visuals, intense boss fights, and a deep storyline that will keep you hooked for hours.
              </p>
              <p>
                Upgrade your weapons, unlock new abilities, and uncover the dark secrets of the mega-corporations that rule the city. Are you ready to become the ultimate runner?
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Screenshots</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <img src="https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80" className="w-full aspect-video rounded-xl object-cover border border-border" alt="Screenshot 1" />
              <img src="https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=800&q=80" className="w-full aspect-video rounded-xl object-cover border border-border" alt="Screenshot 2" />
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Reviews (1,204)</h2>
              <Button variant="outline">Write a Review</Button>
            </div>
            
            <div className="space-y-4">
              {/* Mock Review */}
              <div className="p-6 rounded-2xl bg-surface border border-border">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar fallback="G" size="md" />
                    <div>
                      <p className="font-bold text-foreground">GamerPro99</p>
                      <p className="text-xs text-muted-foreground">Level 24 • 2 days ago</p>
                    </div>
                  </div>
                  <div className="flex text-amber-500">
                    <Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" />
                  </div>
                </div>
                <p className="text-muted-foreground">Absolutely masterpiece! The controls are super tight and the graphics are just amazing for a web game. Highly recommend it to anyone who likes platformers.</p>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar Info (Right) */}
        <div className="space-y-8">
          <div className="p-6 rounded-2xl bg-surface border border-border space-y-6">
            <h3 className="font-bold text-lg border-b border-border pb-2">Game Details</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Monitor className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-semibold">Platforms</p>
                  <p className="text-sm text-muted-foreground">Desktop, Mobile Web</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Keyboard className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-semibold">Controls</p>
                  <p className="text-sm text-muted-foreground">Keyboard & Mouse, Touch</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-semibold">Updated</p>
                  <p className="text-sm text-muted-foreground">October 12, 2023 (v1.2.4)</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border flex justify-between gap-2">
              <Button variant="outline" className="flex-1 text-muted-foreground">
                <Flag className="w-4 h-4 mr-2" /> Report
              </Button>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-surface border border-border space-y-6">
            <div className="flex items-center gap-4">
              <Avatar size="lg" fallback="N" src="https://api.dicebear.com/7.x/avataaars/svg?seed=NeonStudios" />
              <div>
                <p className="text-sm text-muted-foreground">Creator</p>
                <p className="font-bold text-lg">NeonStudios</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button className="w-full" variant="secondary">Follow</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
