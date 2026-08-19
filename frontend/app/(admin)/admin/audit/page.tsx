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

  const getActionBadge = (action: string) => {
    const translations: Record<string, string> = {
      'BAN_USER': t("admin.audit.actions.BAN_USER") || "Cấm người dùng",
      'UNBAN_USER': t("admin.audit.actions.UNBAN_USER") || "Bỏ cấm người dùng",
      'CHANGE_USER_ROLE': t("admin.audit.actions.CHANGE_USER_ROLE") || "Đổi quyền người dùng",
      'CREATE_USER': t("admin.audit.actions.CREATE_USER") || "Tạo người dùng mới",
      'UPDATE_USER': t("admin.audit.actions.UPDATE_USER") || "Cập nhật người dùng",
      'SEND_EMAIL_USER': t("admin.audit.actions.SEND_EMAIL_USER") || "Gửi Email",
      'REJECT_GAME': t("admin.audit.actions.REJECT_GAME") || "Từ chối Game",
      'DELETE_GAME': t("admin.audit.actions.DELETE_GAME") || "Xóa Game",
      'FEATURE_GAME': t("admin.audit.actions.FEATURE_GAME") || "Đánh dấu nổi bật",
      'UNFEATURE_GAME': t("admin.audit.actions.UNFEATURE_GAME") || "Hủy nổi bật",
      'RUN_GC': t("admin.audit.actions.RUN_GC") || "Dọn rác hệ thống (GC)",
      'SYNC_VECTOR_DATABASE': t("admin.audit.actions.SYNC_VECTOR_DATABASE") || "Đồng bộ Vector DB",
      'APPROVE_GAME': t("admin.audit.actions.APPROVE_GAME") || "Duyệt Game",
      'CREATE_CATEGORY': t("admin.audit.actions.CREATE_CATEGORY") || "Tạo danh mục",
      'UPDATE_CATEGORY': t("admin.audit.actions.UPDATE_CATEGORY") || "Sửa danh mục",
      'DELETE_CATEGORY': t("admin.audit.actions.DELETE_CATEGORY") || "Xóa danh mục",
      'UPDATE_SYSTEM_SETTINGS': t("admin.audit.actions.UPDATE_SYSTEM_SETTINGS") || "Cập nhật cấu hình",
      'RESOLVE_REPORT': t("admin.audit.actions.RESOLVE_REPORT") || "Xử lý báo cáo",
      'CREATE_BADGE': t("admin.audit.actions.CREATE_BADGE") || "Tạo danh hiệu",
      'DELETE_BADGE': t("admin.audit.actions.DELETE_BADGE") || "Xóa danh hiệu",
      'GRANT_BADGE': t("admin.audit.actions.GRANT_BADGE") || "Tặng danh hiệu",
      'CREATE_EMAIL_TEMPLATE': t("admin.audit.actions.CREATE_EMAIL_TEMPLATE") || "Tạo mẫu Email"
    };

    const label = translations[action] || action;
    
    let colorClass = "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
    if (action.includes("DELETE") || action.includes("BAN") || action.includes("REJECT") || action.includes("UNFEATURE")) {
      colorClass = "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    } else if (action.includes("CREATE") || action.includes("APPROVE") || action.includes("GRANT")) {
      colorClass = "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    } else if (action.includes("UPDATE") || action.includes("CHANGE") || action.includes("RESOLVE")) {
      colorClass = "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    } else if (action.includes("SYNC") || action.includes("RUN") || action.includes("SEND")) {
      colorClass = "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
    } else if (action.includes("FEATURE")) {
      colorClass = "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    }

    return (
      <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-full whitespace-nowrap ${colorClass}`}>
        {label}
      </span>
    );
  };

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
                      {getActionBadge(log.action)}
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
