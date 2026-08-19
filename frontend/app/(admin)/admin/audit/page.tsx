"use client";

import { useState, useEffect } from "react";
import { fetchAPI } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { Activity, Clock, User, ShieldAlert, ArrowRight } from "lucide-react";

export default function AuditLogsPage() {
  const [mounted, setMounted] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    setMounted(true);
    fetchAPI('/admin/audit')
      .then(res => setLogs(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (!mounted) return null;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-3">
            <Activity className="w-8 h-8 text-primary" />
            {t("admin.audit.title") || "Audit Logs"}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            {t("admin.audit.desc") || "Track all Admin actions on the system."}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                <th className="py-4 px-6 text-xs font-semibold text-zinc-500 uppercase tracking-wider">{t("admin.audit.colTime") || "Time"}</th>
                <th className="py-4 px-6 text-xs font-semibold text-zinc-500 uppercase tracking-wider">{t("admin.audit.colAdmin") || "Admin"}</th>
                <th className="py-4 px-6 text-xs font-semibold text-zinc-500 uppercase tracking-wider">{t("admin.audit.colAction") || "Action"}</th>
                <th className="py-4 px-6 text-xs font-semibold text-zinc-500 uppercase tracking-wider">{t("admin.audit.colEntity") || "Entity"}</th>
                <th className="py-4 px-6 text-xs font-semibold text-zinc-500 uppercase tracking-wider w-1/3">{t("admin.audit.colDetails") || "Details"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="py-4 px-6"><div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse w-full"></div></td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 px-6 text-center text-zinc-500">
                    No logs found.
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="py-3 px-6 text-sm text-zinc-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-zinc-400" />
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">{log.admin?.username || log.adminId}</span>
                      </div>
                    </td>
                    <td className="py-3 px-6">
                      <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full whitespace-nowrap">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {log.entity}
                    </td>
                    <td className="py-3 px-6 text-sm text-zinc-500">
                      <pre className="text-[11px] font-mono bg-zinc-100 dark:bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 whitespace-pre-wrap max-w-sm max-h-32 overflow-y-auto custom-scrollbar">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
