"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function AdminAuditPage() {
  const { t } = useLanguage();
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const token = Cookies.get("token");

  useEffect(() => {
    const fetchAuditLogs = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${apiUrl}/api/admin/audit-logs`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) setAuditLogs(data.data);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchAuditLogs();
  }, []);

  if (loading) return <div className="text-center py-12 text-zinc-500">Loading...</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t("admin.auditLogTitle")}</h3>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                <th className="p-4 font-medium text-zinc-600 dark:text-zinc-400">{t("admin.auditLogTime")}</th>
                <th className="p-4 font-medium text-zinc-600 dark:text-zinc-400">{t("admin.auditLogAdmin")}</th>
                <th className="p-4 font-medium text-zinc-600 dark:text-zinc-400">{t("admin.auditLogAction")}</th>
                <th className="p-4 font-medium text-zinc-600 dark:text-zinc-400">{t("admin.auditLogEntity")}</th>
                <th className="p-4 font-medium text-zinc-600 dark:text-zinc-400">{t("admin.auditLogDetails")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/20">
                  <td className="p-4 whitespace-nowrap text-zinc-600 dark:text-zinc-400">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="p-4 font-medium text-zinc-900 dark:text-white">
                    {log.admin?.username || log.admin?.email || `Admin ID: ${log.adminId}`}
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-md text-xs">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4 text-zinc-700 dark:text-zinc-300">{log.entity}</td>
                  <td className="p-4">
                    <pre className="text-xs text-zinc-500 whitespace-pre-wrap max-w-xs overflow-hidden">
                      {log.details ? JSON.stringify(log.details, null, 2) : "—"}
                    </pre>
                  </td>
                </tr>
              ))}
              {auditLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500">{t("admin.auditLogsEmpty")}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
