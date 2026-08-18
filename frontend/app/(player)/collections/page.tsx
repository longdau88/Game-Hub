"use client";

import { useState, useEffect } from "react";
import { FolderHeart, Plus, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

import { fetchAPI } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

export default function CollectionsPage() {
  const [mounted, setMounted] = useState(false);
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    setMounted(true);
    fetchAPI('/collections')
      .then(res => setCollections(res.data || []))
      .catch(() => setCollections([]))
      .finally(() => setLoading(false));
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex flex-col space-y-10 pb-10">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight">{t("collections") || "Collections"}</h1>
          <p className="text-muted-foreground mt-1">{t("collections_subtitle") || "Organize your favorite games into custom folders."}</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> {t("new_collection") || "New Collection"}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">{t("loading") || "Loading..."}</div>
        ) : collections.length > 0 ? (
          collections.map(collection => (
            <div key={collection.id} className="group relative rounded-2xl overflow-hidden border border-border cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10">
              <div className="aspect-[4/3] relative">
                <img src={collection.cover || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80"} alt={collection.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button variant="glass" className="rounded-full rounded-md px-6 font-bold">{t("view") || "View"}</Button>
                </div>
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-white/70 hover:text-white hover:bg-white/20">
                  <MoreHorizontal className="w-5 h-5" />
                </Button>
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-lg font-bold text-white line-clamp-1">{collection.title}</h3>
                  <p className="text-sm text-zinc-300 flex items-center gap-1.5 mt-1">
                    <FolderHeart className="w-3.5 h-3.5" /> {collection.count || 0} {t("game_count") || "Games"}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center border border-dashed border-border rounded-xl">
             <p className="text-muted-foreground font-semibold">{t("not_available") || "Chưa có"}</p>
             <p className="text-sm text-muted-foreground/70">{t("no_collections") || "You haven't created any collections yet."}</p>
          </div>
        )}

        <div className="rounded-2xl border-2 border-dashed border-border bg-surface/30 flex flex-col items-center justify-center aspect-[4/3] cursor-pointer hover:bg-surface transition-colors hover:border-primary/50 text-muted-foreground hover:text-primary">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Plus className="w-6 h-6" />
          </div>
          <p className="font-semibold">{t("create_collection") || "Create Collection"}</p>
        </div>
      </div>

    </div>
  );
}
