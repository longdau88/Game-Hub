"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadCloud, FileArchive, Image as ImageIcon, CheckCircle2, AlertCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppDialog } from "@/contexts/DialogContext";
import { fetchAPI } from "@/lib/api";

export default function GameUploadWizard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [tags, setTags] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();
  const { notify } = useAppDialog();

  const toggleCategory = (id: string) => {
    setSelectedCategories(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    setMounted(true);
    fetchAPI('/categories')
      .then(res => {
        if (res.data) setCategories(res.data);
      })
      .catch(console.error);
  }, []);

  if (!mounted) return null;

  const handleNext = () => setStep(s => Math.min(3, s + 1));
  const handlePrev = () => setStep(s => Math.max(1, s - 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zipFile) {
      notify({ message: t("creator.selectZipFile") || "Please select a game package (.zip)", variant: "error" });
      setStep(2);
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title || "Untitled");
      formData.append('description', description);
      formData.append('descriptionTranslations', JSON.stringify({ vi: description, en: descriptionEn }));
      if (selectedCategories.length > 0) {
        formData.append('categoryIds', selectedCategories.join(','));
      }
      formData.append('tags', tags);
      formData.append('visibility', isPublic ? "public" : "private");
      formData.append('gameFile', zipFile);
      if (coverImage) {
        formData.append('coverImage', coverImage);
      }

      await fetchAPI('/games/upload', {
        method: 'POST',
        body: formData,
      });

      router.push("/creator/games");
    } catch (err: any) {
      console.error(err);
      let msg = err.message || t("creator.uploadFailed") || "Upload failed";
      if (msg.includes("does not contain an index.html")) {
        msg = t("creator.errorNoIndexHtml") || msg;
      } else if (msg.includes("Invalid zip file format")) {
        msg = t("creator.errorInvalidZip") || msg;
      }
      notify({ message: msg, variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{t("creator.uploadNewGame") || "Upload New Game"}</h1>
        <p className="text-muted-foreground mt-1">{t("creator.uploadDesc") || "Share your creation with the GameHub community."}</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-secondary rounded-full -z-10" />
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-500 rounded-full -z-10 transition-all duration-300"
          style={{ width: `${((step - 1) / 2) * 100}%` }}
        />
        
        {[
          { num: 1, label: t("creator.step1") || "Basic Info" },
          { num: 2, label: t("creator.step2") || "Assets" },
          { num: 3, label: t("creator.step3") || "Review" },
        ].map((s) => (
          <div key={s.num} className="flex flex-col items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-colors ${
              step >= s.num 
                ? "bg-indigo-600 border-indigo-600 text-white" 
                : "bg-surface border-border text-muted-foreground"
            }`}>
              {step > s.num ? <CheckCircle2 className="w-6 h-6" /> : s.num}
            </div>
            <span className={`text-xs font-semibold ${step >= s.num ? "text-foreground" : "text-muted-foreground"}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
        <Card className="bg-surface/50 border-border">
          <CardHeader>
            <CardTitle>
              {step === 1 && (t("creator.step1Title") || "Basic Information")}
              {step === 2 && (t("creator.step2Title") || "Game Assets")}
              {step === 3 && (t("creator.step3Title") || "Review & Publish")}
            </CardTitle>
            <CardDescription>
              {step === 1 && (t("creator.step1Desc") || "Enter the primary details for your game.")}
              {step === 2 && (t("creator.step2Desc") || "Upload your HTML5 game package and marketing assets.")}
              {step === 3 && (t("creator.step3Desc") || "Verify all details before publishing to the platform.")}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 pt-4">
            
            {/* STEP 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="space-y-2">
                  <Label htmlFor="title">{t("creator.gameTitle") || "Game Title"} <span className="text-error">*</span></Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("creator.gameTitlePlaceholder") || "e.g. Neon District: Zero"} required />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">{t("creator.description") || "Description"} (VI) <span className="text-error">*</span></Label>
                  <textarea 
                    id="description" 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder={t("creator.descPlaceholder") || "Describe your game..."}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="descriptionEn">{t("creator.description") || "Description"} (EN)</Label>
                  <textarea 
                    id="descriptionEn" 
                    value={descriptionEn}
                    onChange={(e) => setDescriptionEn(e.target.value)}
                    rows={4}
                    className="flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Game description in English..."
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="category">{t("creator.category") || "Category"}</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {categories.map((c) => {
                        const isSelected = selectedCategories.includes(c.id);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => toggleCategory(c.id)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                              isSelected 
                                ? 'bg-indigo-600 border-indigo-600 text-white' 
                                : 'bg-surface border-border text-muted-foreground hover:border-indigo-500/50 hover:text-foreground'
                            }`}
                          >
                            {c.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tags">{t("creator.tags") || "Tags (comma separated)"}</Label>
                    <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="cyberpunk, platformer, 2d" />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Assets */}
            {step === 2 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                
                <div className="space-y-4">
                  <Label>{t("creator.gamePackage") || "HTML5 Game Package (.zip)"} <span className="text-error">*</span></Label>
                  <input type="file" accept=".zip" className="hidden" ref={zipInputRef} onChange={(e) => setZipFile(e.target.files?.[0] || null)} />
                  <div 
                    onClick={() => zipInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-colors cursor-pointer group ${zipFile ? 'border-indigo-500 bg-indigo-500/5' : 'border-border bg-background/50 hover:bg-secondary/50'}`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${zipFile ? 'bg-indigo-500 text-white' : 'bg-indigo-500/10 text-indigo-500'}`}>
                      {zipFile ? <CheckCircle2 className="w-8 h-8" /> : <FileArchive className="w-8 h-8" />}
                    </div>
                    <h3 className="font-semibold text-lg mb-1">
                      {zipFile ? zipFile.name : (t("creator.clickToUpload") || "Click to upload or drag and drop")}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {zipFile ? `${(zipFile.size / 1024 / 1024).toFixed(2)} MB` : (t("creator.zipHelpText") || "ZIP file containing index.html (Max 200MB)")}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>{t("creator.coverImage") || "Cover Image"}</Label>
                  <input type="file" accept="image/png, image/jpeg" className="hidden" ref={coverInputRef} onChange={(e) => setCoverImage(e.target.files?.[0] || null)} />
                  <div 
                    onClick={() => coverInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-colors cursor-pointer group ${coverImage ? 'border-emerald-500 bg-emerald-500/5' : 'border-border bg-background/50 hover:bg-secondary/50'}`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${coverImage ? 'bg-emerald-500 text-white' : 'bg-emerald-500/10 text-emerald-500'}`}>
                      {coverImage ? <CheckCircle2 className="w-8 h-8" /> : <ImageIcon className="w-8 h-8" />}
                    </div>
                    <h3 className="font-semibold text-lg mb-1">
                      {coverImage ? coverImage.name : (t("creator.uploadCoverArt") || "Upload Cover Art")}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {coverImage ? `${(coverImage.size / 1024 / 1024).toFixed(2)} MB` : (t("creator.coverArtHelpText") || "1920x1080 recommended, PNG or JPG (Max 5MB)")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Review */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="p-4 rounded-xl bg-warning/10 border border-warning/20 flex gap-4 items-start">
                  <AlertCircle className="w-6 h-6 text-warning shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-warning">{t("creator.almostDone") || "Almost done!"}</h4>
                    <p className="text-sm text-warning/80 mt-1">{t("creator.reviewGuidelinesDesc") || "Please review the platform guidelines. By publishing, you agree that this game does not contain malicious code and you have the rights to distribute it."}</p>
                  </div>
                </div>
                
                <div className="border border-border rounded-xl p-6 bg-background space-y-4">
                  <h3 className="font-bold text-lg border-b border-border pb-2">{t("creator.publishingSettings") || "Publishing Settings"}</h3>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-surface/50 border border-border">
                    <div>
                      <p className="font-semibold">{t("creator.visibility") || "Visibility"}</p>
                      <p className="text-sm text-muted-foreground">{t("creator.makePublicDesc") || "Make this game public immediately"}</p>
                    </div>
                    <div onClick={() => setIsPublic(!isPublic)} className={`w-12 h-6 rounded-full relative cursor-pointer ${isPublic ? "bg-success" : "bg-muted"}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isPublic ? "right-1" : "left-1"}`} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
          </CardContent>

          <CardFooter className="flex items-center justify-between p-6 border-t border-border bg-surface/50 rounded-b-xl">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handlePrev} 
              disabled={step === 1 || loading}
            >{t("creator.back") || "Back"}</Button>
            <Button 
              type="submit" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={loading}
            >
              {loading ? (t("creator.processing") || "Processing...") : (step === 3 ? (t("creator.publishGame") || "Publish Game") : (t("creator.continue") || "Continue"))}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
