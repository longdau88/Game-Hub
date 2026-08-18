"use client";

import { useLanguage } from "@/contexts/LanguageContext";

export default function AdminSettingsPage() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("admin.tabSettings") || "Settings"}</h1>
        <p className="text-muted-foreground">This module is under construction.</p>
      </div>
      
      <div className="bg-surface border border-border rounded-xl p-8 text-center">
        <p className="text-muted-foreground">Settings configuration will be implemented here.</p>
      </div>
    </div>
  );
}
