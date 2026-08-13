"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useAppDialog } from "../../../contexts/DialogContext";

export default function AdminStoragePage() {
  const { t } = useLanguage();
  const { confirm, notify } = useAppDialog();
  const [storageStats, setStorageStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const token = Cookies.get("token");

  const formatBytes = (bytes: number) => {
    if (bytes === 0 || !bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  useEffect(() => {
    const fetchStorage = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${apiUrl}/api/admin/storage/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) setStorageStats(data.data);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchStorage();
  }, []);

  const runGC = async () => {
    if (!await confirm({ message: t("admin.advConfirmGC"), variant: "warning" })) return;
    setRunning(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/storage/cleanup`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await res.json();
        await notify({ message: t("admin.cleanupSuccess"), variant: "success" });
      } else {
        await notify({ message: t("admin.actionFailed"), variant: "error" });
      }
    } catch (e) { console.error(e); await notify({ message: t("admin.actionFailed"), variant: "error" }); }
    finally { setRunning(false); }
  };

  if (loading) return <div className="flex flex-col items-center justify-center py-20 text-zinc-500 dark:text-zinc-400"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div><p className="font-medium">{t("common.loading") || "Đang tải..."}</p></div>;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">{t("admin.storageTitle")}</h3>

      {storageStats && (
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-zinc-600 dark:text-zinc-400">{t("admin.storageUsed")}</span>
            <span className="text-2xl font-bold">{formatBytes(storageStats.totalBytes)}</span>
          </div>
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2">
            <div
              className="bg-primary rounded-full h-2 transition-all"
              style={{ width: `${Math.min(storageStats.percentage || 0, 100)}%` }}
            />
          </div>
          <p className="text-xs text-zinc-500 mt-2">
            {t("admin.storageDesc")} {formatBytes(storageStats.totalBytesLimit || 10 * 1024 * 1024 * 1024)}
          </p>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-6">
        <h4 className="font-semibold mb-2">{t("admin.storageGC")}</h4>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">{t("admin.storageGCDesc")}</p>
        <button
          onClick={runGC}
          disabled={running}
          className="px-5 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-zinc-900 dark:text-white rounded-lg font-medium transition-colors"
        >
          {running ? "Running..." : t("admin.storageGCBtn")}
        </button>
      </div>
    </div>
  );
}

