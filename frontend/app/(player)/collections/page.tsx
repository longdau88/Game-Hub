"use client";

import { useState, useEffect } from "react";
import { FolderHeart, Plus, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

const MOCK_COLLECTIONS = [
  { id: "1", title: "Weekend Vibes", count: 12, cover: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80" },
  { id: "2", title: "Hardcore Platformers", count: 5, cover: "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=400&q=80" },
  { id: "3", title: "Co-op with Friends", count: 8, cover: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&q=80" },
];

export default function CollectionsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="flex flex-col space-y-10 pb-10">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Collections</h1>
          <p className="text-muted-foreground mt-1">Organize your favorite games into custom folders.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> New Collection
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {MOCK_COLLECTIONS.map(collection => (
          <div key={collection.id} className="group relative rounded-2xl overflow-hidden border border-border cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10">
            <div className="aspect-[4/3] relative">
              <img src={collection.cover} alt={collection.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button variant="glass" className="rounded-full rounded-md px-6 font-bold">View</Button>
              </div>
              <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-white/70 hover:text-white hover:bg-white/20">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-lg font-bold text-white line-clamp-1">{collection.title}</h3>
                <p className="text-sm text-zinc-300 flex items-center gap-1.5 mt-1">
                  <FolderHeart className="w-3.5 h-3.5" /> {collection.count} Games
                </p>
              </div>
            </div>
          </div>
        ))}

        <div className="rounded-2xl border-2 border-dashed border-border bg-surface/30 flex flex-col items-center justify-center aspect-[4/3] cursor-pointer hover:bg-surface transition-colors hover:border-primary/50 text-muted-foreground hover:text-primary">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Plus className="w-6 h-6" />
          </div>
          <p className="font-semibold">Create Collection</p>
        </div>
      </div>

    </div>
  );
}
