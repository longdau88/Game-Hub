"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function AdminSettingsPage() {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const token = Cookies.get("token");

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${apiUrl}/api/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setSettings(await res.json());
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchSettings();
  }, []);

  const saveSettings = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/settings`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) alert("Settings saved successfully!");
      else alert("Failed to save settings");
    } catch (error) { console.error(error); }
  };

  if (loading) return <div className="flex flex-col items-center justify-center py-20 text-zinc-500 dark:text-zinc-400"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div><p className="font-medium">{t("common.loading") || "Đang tải..."}</p></div>;

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-6 max-w-xl">
      <h3 className="font-semibold text-lg">{t("admin.settingsTitle")}</h3>

      <div className="flex items-center gap-3 p-4 bg-muted/30 border border-border rounded-lg">
        <input
          type="checkbox"
          id="maintenanceMode"
          checked={settings.maintenanceMode === 'true' || settings.maintenanceMode === true}
          onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
          className="w-4 h-4 accent-primary"
        />
        <div>
          <label htmlFor="maintenanceMode" className="font-medium text-sm">{t("admin.settingsMaintenance")}</label>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">{t("admin.settingsMaintenanceDesc")}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 p-4 bg-muted/30 border border-border rounded-lg">
        <input
          type="checkbox"
          id="registrationEnabled"
          checked={settings.registrationEnabled === 'true' || settings.registrationEnabled === true}
          onChange={(e) => setSettings({ ...settings, registrationEnabled: e.target.checked })}
          className="w-4 h-4 accent-primary"
        />
        <div>
          <label htmlFor="registrationEnabled" className="font-medium text-sm">{t("admin.settingsRegistration")}</label>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">{t("admin.settingsRegistrationDesc")}</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">{t("admin.settingsUploadLimit")}</label>
        <input
          type="number"
          value={settings.maxUploadSizeMB || 100}
          onChange={(e) => setSettings({ ...settings, maxUploadSizeMB: parseInt(e.target.value) })}
          className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:border-primary"
        />
        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">{t("admin.settingsUploadLimitDesc")}</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Email Provider</label>
        <select
          value={settings.emailProvider || "resend"}
          onChange={(e) => setSettings({ ...settings, emailProvider: e.target.value })}
          className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:border-primary"
        >
          <option value="resend">Resend (API)</option>
          <option value="nodemailer">Gmail SMTP (Nodemailer)</option>
        </select>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">{t("admin.settingsEmailProviderDesc")}</p>
      </div>

      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <button
          onClick={saveSettings}
          className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-zinc-900 dark:text-white rounded-lg font-semibold transition-colors"
        >
          {t("admin.settingsSave")}
        </button>
      </div>
    </div>
  );
}

