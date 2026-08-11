"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Cookies from "js-cookie";
import { UploadCloud, FileType2, Loader2, Save } from "lucide-react";
import { useLanguage } from "../../../../contexts/LanguageContext";

export default function EditGamePage() {
  const router = useRouter();
  const params = useParams();
  const gameId = params?.id as string;
  const { t } = useLanguage();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [existingCover, setExistingCover] = useState("");
  
  const [controls, setControls] = useState<{ action: string; key: string }[]>([]);
  
  const [memorySize, setMemorySize] = useState(256);
  const [enableBrotli, setEnableBrotli] = useState(false);
  const [enableGzip, setEnableGzip] = useState(false);
  const [firebaseTrackingId, setFirebaseTrackingId] = useState("");
  
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
        const gameRes = await fetch(`${apiUrl}/api/games/${gameId}`);
        if (gameRes.ok) {
          const gameData = await gameRes.json();
          setTitle(gameData.title);
          setDescription(gameData.descriptionTranslations?.vi || gameData.description || "");
          setDescriptionEn(gameData.descriptionTranslations?.en || "");
          setExistingCover(gameData.coverImageUrl || "");
          if (gameData.categories && gameData.categories.length > 0) {
            setSelectedCategories(gameData.categories.map((c: any) => c.id.toString()));
          }
          if (gameData.controls) {
            setControls(gameData.controls);
          }
          if (gameData.engineConfig) {
            setMemorySize(gameData.engineConfig.memorySize || 256);
            setEnableBrotli(gameData.engineConfig.enableBrotli || false);
            setEnableGzip(gameData.engineConfig.enableGzip || false);
            setFirebaseTrackingId(gameData.engineConfig.firebaseTrackingId || "");
          }
        }
      } catch (err) {
        console.error("Failed to load data", err);
        setError("Failed to load game data");
      } finally {
        setLoading(false);
      }
    };
    if (gameId) fetchData();
  }, [gameId]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCategories.length === 0) {
      setError("Vui lòng chọn ít nhất một thể loại.");
      return;
    }
    
    setSaving(true);
    setError("");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("descriptionTranslations", JSON.stringify({ vi: description, en: descriptionEn }));
    formData.append("categoryIds", selectedCategories.join(','));
    formData.append("controls", JSON.stringify(controls));
    formData.append("engineConfig", JSON.stringify({ memorySize, enableBrotli, enableGzip, firebaseTrackingId }));
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
      const res = await fetch(`${apiUrl}/api/games/${gameId}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      
      if (res.ok) {
        router.push("/profile"); // Assuming they came from profile
      } else {
        setError(data.error || t("profile.updateError") || "Update failed");
      }
    } catch (err) {
      setError(t("upload.errorNetwork") || "Network error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-zinc-900 dark:text-white">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t("upload.editTitle") || "Edit Game"}</h1>
        <p className="text-zinc-600 dark:text-zinc-400">{t("upload.editSubtitle") || "Update your game information"}</p>
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
              placeholder={t("upload.gameTitlePlaceholder")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">{t("upload.description")} (VI)</label>
            <textarea 
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-3 text-zinc-900 dark:text-white min-h-[120px]"
              placeholder={t("upload.descPlaceholder") || "Game description..."}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">{t("upload.description")} (EN)</label>
            <textarea 
              value={descriptionEn}
              onChange={e => setDescriptionEn(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-3 text-zinc-900 dark:text-white min-h-[120px]"
              placeholder="Game description in English..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">{t("upload.category")}</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    const idStr = cat.id.toString();
                    if (selectedCategories.includes(idStr)) {
                      setSelectedCategories(selectedCategories.filter(id => id !== idStr));
                    } else {
                      setSelectedCategories([...selectedCategories, idStr]);
                    }
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                    selectedCategories.includes(cat.id.toString())
                      ? 'bg-blue-600 border-blue-500 text-zinc-900 dark:text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:bg-zinc-700 hover:text-zinc-900 dark:text-white'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            {selectedCategories.length === 0 && (
              <p className="text-red-400 text-xs mt-2">Vui lòng chọn ít nhất một thể loại.</p>
            )}
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
              {(coverImage || existingCover) && (
                <div className="mt-4 flex justify-center">
                  <img src={coverImage ? URL.createObjectURL(coverImage) : existingCover} alt="Cover preview" className="h-32 object-contain rounded-lg border border-zinc-300 dark:border-zinc-700" />
                </div>
              )}
            </div>
          </div>

          {/* Engine Configuration */}
          <div className="bg-zinc-100/30 dark:bg-zinc-800/30 rounded-xl p-6 border border-zinc-300/50 dark:border-zinc-700/50">
            <h3 className="text-lg font-medium text-zinc-800 dark:text-zinc-200 mb-4">{t("upload.engineConfig")}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t("upload.memorySize")}</label>
                <input 
                  type="number" 
                  value={memorySize}
                  onChange={(e) => setMemorySize(parseInt(e.target.value) || 256)}
                  className="w-full max-w-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-2 text-zinc-900 dark:text-white transition-colors" 
                />
                <p className="text-xs text-zinc-500 mt-1">{t("upload.memorySizeHint")}</p>
              </div>
              <div className="flex gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={enableBrotli}
                    onChange={(e) => setEnableBrotli(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-zinc-900 bg-white dark:bg-zinc-900"
                  />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("upload.enableBrotli")}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={enableGzip}
                    onChange={(e) => setEnableGzip(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-zinc-900 bg-white dark:bg-zinc-900"
                  />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("upload.enableGzip")}</span>
                </label>
              </div>
              <p className="text-xs text-zinc-500 italic mt-2">{t("upload.compressionHint")}</p>
              
              <div className="pt-2">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t("upload.firebaseTracking")}</label>
                <input 
                  type="text" 
                  value={firebaseTrackingId}
                  onChange={(e) => setFirebaseTrackingId(e.target.value)}
                  placeholder="G-XXXXXXXXXX"
                  className="w-full max-w-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-2 text-zinc-900 dark:text-white transition-colors uppercase" 
                />
                <p className="text-xs text-zinc-500 mt-1">{t("upload.firebaseTrackingHint")}</p>
              </div>
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
                  {t("upload.btnUpdating") || "Updating..."}
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {t("upload.btnUpdate") || "Update Game"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
