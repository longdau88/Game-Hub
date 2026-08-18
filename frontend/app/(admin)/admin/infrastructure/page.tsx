"use client";

import { useState, useEffect } from "react";
import { fetchAPI } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppDialog } from "@/contexts/DialogContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Server, HardDrive, Database, ShieldAlert, CheckCircle, RefreshCcw, Trash2 } from "lucide-react";

export default function InfrastructurePage() {
  const { t } = useLanguage();
  const { notify } = useAppDialog();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [settings, setSettings] = useState({
    maintenanceMode: "false",
    registrationEnabled: "true",
    maxUploadSizeMB: "100"
  });

  const [storageStats, setStorageStats] = useState({
    db: { used: 0, limit: 1 * 1024 * 1024 * 1024, percent: 0 },
    server: { used: 0, limit: 10 * 1024 * 1024 * 1024, percent: 0 }
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [settingsRes, storageRes] = await Promise.all([
        fetchAPI('/settings'),
        fetchAPI('/admin/storage/stats')
      ]);

      if (settingsRes) {
        setSettings({
          maintenanceMode: settingsRes.maintenanceMode || "false",
          registrationEnabled: settingsRes.registrationEnabled || "true",
          maxUploadSizeMB: settingsRes.maxUploadSizeMB || "100"
        });
      }

      if (storageRes?.data) {
        setStorageStats(storageRes.data);
      }
    } catch (err) {
      console.error(err);
      notify({ message: "Failed to load infrastructure data.", variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    loadData();
  }, []);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await fetchAPI('/settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
      notify({ message: t("admin.settingsSaved") || "Settings saved successfully.", variant: "success" });
    } catch (err) {
      notify({ message: "Failed to save settings.", variant: "error" });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCleanup = async () => {
    setCleaning(true);
    try {
      const res = await fetchAPI('/admin/storage/cleanup', { method: 'POST' });
      notify({ message: res.message || "Cleanup successful.", variant: "success" });
      await loadData();
    } catch (err) {
      notify({ message: "Failed to run cleanup.", variant: "error" });
    } finally {
      setCleaning(false);
    }
  };

  const handleAiSync = async () => {
    setSyncing(true);
    try {
      const res = await fetchAPI('/admin/ai/sync', { method: 'POST' });
      notify({ message: res.message || "Sync successful.", variant: "success" });
    } catch (err) {
      notify({ message: "Failed to sync Vector DB.", variant: "error" });
    } finally {
      setSyncing(false);
    }
  };

  if (!mounted) return null;

  const formatBytes = (bytes: number | null | undefined) => {
    if (bytes === null || bytes === undefined || isNaN(bytes) || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    if (i < 0) return '0 Bytes';
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + (sizes[i] || 'Bytes');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("admin.infrastructure") || "Infrastructure"}</h1>
        <p className="text-muted-foreground">{t("admin.infrastructureDesc") || "Manage system, storage, and server configurations."}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Settings */}
          <Card className="bg-surface border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Server className="w-5 h-5 text-indigo-500" />
                {t("admin.systemSettings") || "System Settings"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-foreground">{t("admin.maintenanceMode") || "Maintenance Mode"}</div>
                  <div className="text-sm text-muted-foreground">{t("admin.maintenanceModeDesc") || "Lock user access."}</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={settings.maintenanceMode === "true"} onChange={e => setSettings({...settings, maintenanceMode: e.target.checked ? "true" : "false"})} />
                  <div className="w-11 h-6 bg-secondary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-foreground">{t("admin.registrationEnabled") || "Enable Registration"}</div>
                  <div className="text-sm text-muted-foreground">{t("admin.registrationEnabledDesc") || "Allow new users to register."}</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={settings.registrationEnabled === "true"} onChange={e => setSettings({...settings, registrationEnabled: e.target.checked ? "true" : "false"})} />
                  <div className="w-11 h-6 bg-secondary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="space-y-2">
                <label className="font-medium text-foreground block">{t("admin.maxUploadSize") || "Max Upload Size (MB)"}</label>
                <Input 
                  type="number"
                  className="bg-background border-border max-w-[200px]"
                  value={settings.maxUploadSizeMB}
                  onChange={e => setSettings({...settings, maxUploadSizeMB: e.target.value})}
                />
              </div>

              <Button onClick={handleSaveSettings} disabled={savingSettings} className="w-full sm:w-auto">
                {savingSettings ? <RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                {t("admin.saveSettings") || "Save Settings"}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {/* Storage Manager */}
            <Card className="bg-surface border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-emerald-500" />
                  {t("admin.storageManager") || "Storage Management"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("admin.dbStorage") || "Database (DB)"}</span>
                    <span className="font-medium text-foreground">{formatBytes(storageStats.db?.used)} / {formatBytes(storageStats.db?.limit)}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-3">
                    <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${Math.min(100, storageStats.db?.percent || 0)}%` }} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("admin.serverStorage") || "Storage Server (R2)"}</span>
                    <span className="font-medium text-foreground">{formatBytes(storageStats.server?.used)} / {formatBytes(storageStats.server?.limit)}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-3">
                    <div className="bg-emerald-500 h-3 rounded-full" style={{ width: `${Math.min(100, storageStats.server?.percent || 0)}%` }} />
                  </div>
                </div>

                <Button variant="secondary" onClick={handleCleanup} disabled={cleaning} className="w-full">
                  {cleaning ? <RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2 text-rose-500" />}
                  {t("admin.runCleanup") || "Run Cleanup"}
                </Button>
              </CardContent>
            </Card>

            {/* AI Vector DB Sync */}
            <Card className="bg-surface border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Database className="w-5 h-5 text-amber-500" />
                  {t("admin.aiSync") || "AI Vector Sync"}
                </CardTitle>
                <CardDescription>{t("admin.aiSyncDesc") || "Update game data to Vector DB for AI recommendations."}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="secondary" onClick={handleAiSync} disabled={syncing} className="w-full">
                  {syncing ? <RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCcw className="w-4 h-4 mr-2 text-amber-500" />}
                  {t("admin.runSync") || "Run Sync"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
