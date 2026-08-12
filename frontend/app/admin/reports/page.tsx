"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function AdminReportsPage() {
  const { t } = useLanguage();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const token = Cookies.get("token");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/reports/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setReports(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const resolveReport = async (id: number) => {
    try {
      const res = await fetch(`${apiUrl}/api/reports/admin/${id}/resolve`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchData();
    } catch (error) { console.error(error); }
  };

  if (loading) return <div className="flex flex-col items-center justify-center py-20 text-zinc-500 dark:text-zinc-400"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div><p className="font-medium">{t("common.loading") || "Đang tải..."}</p></div>;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-border bg-muted/30">
        <h3 className="font-semibold">{t("admin.reportsTitle")}</h3>
      </div>
      <div className="p-0">
        {reports.length === 0 ? (
          <p className="p-6 text-center text-zinc-500">{t("admin.reportsEmpty")}</p>
        ) : (
          <ul className="divide-y divide-border">
            {reports.map((report) => (
              <li key={report.id} className="p-4 flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">{t("admin.reportsUser")}:</span>
                    <span className="text-zinc-600 dark:text-zinc-400">{report.reporter?.username || report.reporter?.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">{t("admin.reportsGame")}:</span>
                    <span className="text-zinc-600 dark:text-zinc-400">{report.game?.title}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">{t("admin.reportsReason")}:</span>
                    <span className="text-zinc-600 dark:text-zinc-400">{report.reason}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${report.status === "resolved" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"}`}>
                    {report.status === "resolved" ? t("admin.reportsResolved") : t("admin.reportsPending")}
                  </span>
                  {report.status !== "resolved" && (
                    <button
                      onClick={() => resolveReport(report.id)}
                      className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-md text-xs font-medium transition-colors"
                    >
                      {t("admin.reportsBtnResolve")}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

