"use client";

import { useState, useEffect, use } from "react";
import { useRouter, useParams } from "next/navigation";
import Cookies from "js-cookie";
import { Save, FileType2, Loader2, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppDialog } from "@/contexts/DialogContext";
import Link from "next/link";

export default function EditGamePage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { t } = useLanguage();
  const { notify } = useAppDialog();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [existingCoverUrl, setExistingCoverUrl] = useState("");
  
  const [controls, setControls] = useState<{ action: string; key: string }[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        
        // Fetch categories
        const catRes = await fetch(`${apiUrl}/api/categories`);
        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData);
        }

        // Fetch game details
        if (!id) return;
        const gameRes = await fetch(`${apiUrl}/api/games/${id}`);
        if (gameRes.ok) {
          const gameData = await gameRes.json();
          setTitle(gameData.title || "");
          setDescription(gameData.description || "");
          setDescriptionEn(gameData.descriptionTranslations?.en || "");
          setExistingCoverUrl(gameData.coverImageUrl || "");
          
          if (gameData.categories && gameData.categories.length > 0) {
            setSelectedCategory(gameData.categories[0].id.toString());
          }
          
          if (gameData.controls && Array.isArray(gameData.controls)) {
            setControls(gameData.controls);
          } else {
            setControls([]);
          }
        } else {
          setError("Failed to load game details");
        }
      } catch (err) {
        console.error("Failed to load data", err);
        setError("Network error");
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchData();
    }
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    setSaving(true);
    setError("");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("descriptionTranslations", JSON.stringify({ vi: description, en: descriptionEn }));
    formData.append("categoryIds", selectedCategory);
    formData.append("controls", JSON.stringify(controls));
    if (coverImage) {
      formData.append("coverImage", coverImage);
    }

    const token = Cookies.get("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/games/${id}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      
      if (res.ok) {
        await notify({ message: t("profile.updateSuccess"), variant: "success" });
        router.push("/profile");
      } else {
        setError(data.error || t("profile.updateError"));
      }
    } catch (err) {
      setError(t("upload.errorNetwork"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-24 flex justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="mb-6">
        <button onClick={() => router.back()} className="inline-flex items-center text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-white transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("creator.back") || "Back"}
        </button>
      </div>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t("profile.editGame")}</h1>
      </div>

      <div className="bg-white/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 md:p-8">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">{t("upload.gameTitle")}</label>
            <input 
              type="text" 
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-3 text-zinc-900 dark:text-white transition-colors" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">{t("upload.description")} (VI)</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-3 text-zinc-900 dark:text-white transition-colors resize-none" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">{t("upload.description")} (EN)</label>
            <textarea 
              value={descriptionEn}
              onChange={(e) => setDescriptionEn(e.target.value)}
              rows={4}
              placeholder="Game description in English..."
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-3 text-zinc-900 dark:text-white transition-colors resize-none" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">{t("upload.category")}</label>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-3 text-zinc-900 dark:text-white transition-colors"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("upload.controls")}</label>
              <button 
                type="button" 
                onClick={() => setControls([...controls, { action: "", key: "" }])}
                className="text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2 py-1 rounded"
              >
                + {t("upload.addControl")}
              </button>
            </div>
            <div className="space-y-3">
              {controls.map((control, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={control.action}
                    onChange={(e) => {
                      const newControls = [...controls];
                      newControls[index].action = e.target.value;
                      setControls(newControls);
                    }}
                    placeholder={t("upload.controlAction")}
                    className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-2 text-sm text-zinc-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={control.key}
                    onChange={(e) => {
                      const newControls = [...controls];
                      newControls[index].key = e.target.value;
                      setControls(newControls);
                    }}
                    placeholder={t("upload.controlKey")}
                    className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-2 text-sm text-zinc-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newControls = controls.filter((_, i) => i !== index);
                      setControls(newControls);
                    }}
                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              {controls.length === 0 && (
                <p className="text-sm text-zinc-500 italic">{t("upload.noControls")}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">{t("upload.coverImage")}</label>
            <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-8 text-center hover:bg-zinc-100/30 dark:bg-zinc-800/30 transition-colors relative">
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <FileType2 className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
              <p className="text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                {coverImage ? coverImage.name : t("upload.coverImageHint")}
              </p>
              {(coverImage || existingCoverUrl) && (
                <div className="mt-4 flex justify-center">
                  <img src={coverImage ? URL.createObjectURL(coverImage) : existingCoverUrl} alt="Cover preview" className="h-32 object-contain rounded-lg border border-zinc-300 dark:border-zinc-700" />
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button 
              type="submit" 
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-zinc-900 dark:text-white px-6 py-4 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(37,99,235,0.2)]"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t("profile.saving")}
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {t("profile.editGame")}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
