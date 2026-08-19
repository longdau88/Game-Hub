"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("nav.settings") || "Settings"}</h1>
          <p className="text-muted-foreground mt-1">{t("creator.settingsDesc") || "Manage your creator profile and preferences."}</p>
        </div>
      </div>

      <Card className="bg-surface/50 border-border">
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>Settings functionality is currently under development.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Please check back later.</p>
        </CardContent>
      </Card>
    </div>
  );
}
