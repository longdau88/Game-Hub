"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { UploadCloud, FileType2, Loader2 } from "lucide-react";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function UploadGamePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [file, setFile] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const res = await fetch(`${apiUrl}/api/categories`);
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
          if (data.length > 0) setSelectedCategory(data[0].id.toString());
        }
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    };
    fetchCategories();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError(t("upload.errorNoFile"));
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("categoryIds", selectedCategory);
    formData.append("gameFile", file);

    const token = Cookies.get("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/games/upload`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      
      if (res.ok) {
        router.push("/creator");
      } else {
        setError(data.error || t("upload.errorUploadFailed"));
      }
    } catch (err) {
      setError(t("upload.errorNetwork"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t("upload.title")}</h1>
        <p className="text-zinc-400">{t("upload.subtitle")}</p>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 md:p-8">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">{t("upload.gameTitle")}</label>
            <input 
              type="text" 
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-3 text-white transition-colors" 
              placeholder={t("upload.gameTitlePlaceholder")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">{t("upload.description")}</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full bg-zinc-900 border border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-3 text-white transition-colors resize-none" 
              placeholder={t("upload.descriptionPlaceholder")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">{t("upload.category")}</label>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-3 text-white transition-colors"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">{t("upload.gameFiles")}</label>
            <div className="border-2 border-dashed border-zinc-700 rounded-xl p-8 text-center hover:bg-zinc-800/30 transition-colors relative">
              <input 
                type="file" 
                accept=".zip"
                required
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <FileType2 className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
              <p className="text-zinc-300 font-medium mb-1">
                {file ? file.name : t("upload.dropzone")}
              </p>
              <p className="text-zinc-500 text-sm">
                {t("upload.dropzoneHint")}
              </p>
              {file && (
                <div className="mt-4 inline-block bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-medium border border-blue-500/30">
                  {t("upload.selected")} {(file.size / 1024 / 1024).toFixed(2)} MB
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800">
            <button 
              type="submit" 
              disabled={loading || !file}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(37,99,235,0.2)]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t("upload.btnUploading")}
                </>
              ) : (
                <>
                  <UploadCloud className="w-5 h-5" />
                  {t("upload.btnUpload")}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
