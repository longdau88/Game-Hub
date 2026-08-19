"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadCloud, FileArchive, Image as ImageIcon, CheckCircle2, AlertCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchAPI } from "@/lib/api";

export default function GameUploadWizard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const { t } = useLanguage();

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API upload
    setTimeout(() => {
      setLoading(false);
      router.push("/creator/dashboard");
    }, 1500);
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
                  <Input id="title" placeholder={t("creator.gameTitlePlaceholder") || "e.g. Neon District: Zero"} required />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">{t("creator.description") || "Description"} <span className="text-error">*</span></Label>
                  <textarea 
                    id="description" 
                    rows={4}
                    className="flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder={t("creator.descPlaceholder") || "Describe your game..."}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="category">{t("creator.category") || "Category"}</Label>
                    <select id="category" multiple className="min-h-[100px] flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tags">{t("creator.tags") || "Tags (comma separated)"}</Label>
                    <Input id="tags" placeholder="cyberpunk, platformer, 2d" />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Assets */}
            {step === 2 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                
                <div className="space-y-4">
                  <Label>{t("creator.gamePackage") || "HTML5 Game Package (.zip)"} <span className="text-error">*</span></Label>
                  <div className="border-2 border-dashed border-border rounded-2xl p-10 flex flex-col items-center justify-center text-center bg-background/50 hover:bg-secondary/50 transition-colors cursor-pointer group">
                    <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <FileArchive className="w-8 h-8 text-indigo-500" />
                    </div>
                    <h3 className="font-semibold text-lg mb-1">{t("creator.clickToUpload") || "Click to upload or drag and drop"}</h3>
                    <p className="text-sm text-muted-foreground">{t("creator.zipHelpText") || "ZIP file containing index.html (Max 200MB)"}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>{t("creator.coverImage") || "Cover Image"} <span className="text-error">*</span></Label>
                  <div className="border-2 border-dashed border-border rounded-2xl p-10 flex flex-col items-center justify-center text-center bg-background/50 hover:bg-secondary/50 transition-colors cursor-pointer group">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <ImageIcon className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h3 className="font-semibold text-lg mb-1">Upload Cover Art</h3>
                    <p className="text-sm text-muted-foreground">1920x1080 recommended, PNG or JPG (Max 5MB)</p>
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
                    <h4 className="font-semibold text-warning">Almost done!</h4>
                    <p className="text-sm text-warning/80 mt-1">Please review the platform guidelines. By publishing, you agree that this game does not contain malicious code and you have the rights to distribute it.</p>
                  </div>
                </div>
                
                <div className="border border-border rounded-xl p-6 bg-background space-y-4">
                  <h3 className="font-bold text-lg border-b border-border pb-2">Publishing Settings</h3>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-surface/50 border border-border">
                    <div>
                      <p className="font-semibold">Visibility</p>
                      <p className="text-sm text-muted-foreground">Make this game public immediately</p>
                    </div>
                    <div className="w-12 h-6 rounded-full bg-success relative cursor-pointer">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
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
