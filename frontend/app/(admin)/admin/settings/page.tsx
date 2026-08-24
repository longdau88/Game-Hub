"use client";

import { useState, useEffect } from "react";
import { fetchAPI } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppDialog } from "@/contexts/DialogContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Server, CheckCircle, RefreshCcw } from "lucide-react";

export default function AdminSettingsPage() {
  const { t } = useLanguage();
  const { notify } = useAppDialog();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  const [settings, setSettings] = useState({
    maintenanceMode: "false",
    registrationEnabled: "true",
    maxUploadSizeMB: "100",
    emailProvider: "resend"
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const settingsRes = await fetchAPI('/settings');
      if (settingsRes) {
        setSettings({
          maintenanceMode: settingsRes.maintenanceMode || "false",
          registrationEnabled: settingsRes.registrationEnabled || "true",
          maxUploadSizeMB: settingsRes.maxUploadSizeMB || "100",
          emailProvider: settingsRes.emailProvider || "resend"
        });
      }
    } catch (err) {
      console.error(err);
      notify({ message: t("admin.loadDataError") || "Failed to load infrastructure data.", variant: "error" });
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
      notify({ message: t("admin.saveSettingsError") || "Failed to save settings.", variant: "error" });
    } finally {
      setSavingSettings(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("admin.tabSettings") || "Settings"}</h1>
        <p className="text-muted-foreground">{t("admin.settingsDesc") || "System-wide settings and configurations."}</p>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

              <div className="space-y-2">
                <label className="font-medium text-foreground block">{t("admin.emailProvider") || "Email Provider"}</label>
                <select 
                  className="flex h-10 w-full max-w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={settings.emailProvider}
                  onChange={e => setSettings({...settings, emailProvider: e.target.value})}
                >
                  <option value="resend">Resend API</option>
                  <option value="smtp">SMTP (Gmail)</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  SMTP utilizes the EMAIL_USER and EMAIL_PASS configured in the .env file.
                </p>
              </div>

              <Button onClick={handleSaveSettings} disabled={savingSettings} className="w-full sm:w-auto">
                {savingSettings ? <RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                {t("admin.saveSettings") || "Save Settings"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
