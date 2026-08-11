"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Check, X, Play, Settings, LayoutDashboard, Gamepad2, Users, Tags, Trash2, Ban, Flag, ShieldAlert } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const pathname = usePathname();

  const getTabClass = (path: string) => {
    return pathname === path
      ? "bg-primary/10 text-primary w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
      : "text-zinc-400 hover:text-white hover:bg-zinc-800 w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors";
  };

  const getSubTabClass = (path: string) => {
    return pathname === path
      ? "bg-primary/10 text-primary w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors pl-8"
      : "text-zinc-400 hover:text-white hover:bg-zinc-800 w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors pl-8";
  };
  
  const getSubTabClassYellow = (path: string) => {
    return pathname === path
      ? "bg-yellow-500/10 text-yellow-500 w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors pl-8"
      : "text-zinc-400 hover:text-white hover:bg-zinc-800 w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors pl-8";
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl flex flex-col md:flex-row gap-8">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 shrink-0">
        <div className="flex items-center gap-3 mb-8 px-2">
          <Settings className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold">{t("admin.title")}</h1>
        </div>
        
        <nav className="space-y-1">
          <div className="p-4 space-y-1">
            <Link href="/admin/dashboard" className={getTabClass("/admin/dashboard")}>
              <LayoutDashboard className="w-4 h-4" /> {t("admin.tabDashboard")}
            </Link>
            
            <div className="pt-2">
              <span className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">{t("admin.tabGames")}</span>
            </div>
            
            <Link href="/admin/games" className={getSubTabClass("/admin/games")}>
              <Gamepad2 className="w-4 h-4" /> {t("admin.tabGamesPublished")}
            </Link>
            
            <Link href="/admin/pending-games" className={getSubTabClassYellow("/admin/pending-games")}>
              <Check className="w-4 h-4" /> {t("admin.tabGamesPending")}
            </Link>
            
            <Link href="/admin/users" className={getTabClass("/admin/users")}>
              <Users className="w-4 h-4" /> {t("admin.tabUsers")}
            </Link>
            
            <Link href="/admin/reports" className={getTabClass("/admin/reports")}>
              <Flag className="w-4 h-4" /> {t("admin.tabReports")}
            </Link>
            
            <Link href="/admin/settings" className={getTabClass("/admin/settings")}>
              <Settings className="w-4 h-4" /> {t("admin.tabSettings")}
            </Link>
            
            <Link href="/admin/storage" className={getTabClass("/admin/storage")}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg> {t("admin.tabStorage")}
            </Link>
            
            <Link href="/admin/analytics" className={getTabClass("/admin/analytics")}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> {t("admin.tabAnalytics")}
            </Link>
            
            <Link href="/admin/mail" className={getTabClass("/admin/mail")}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> {t("admin.tabMail")}
            </Link>
            
            <Link href="/admin/categories" className={getTabClass("/admin/categories")}>
              <Tags className="w-4 h-4" /> {t("admin.tabCategories")}
            </Link>
            
            <Link href="/admin/gamification" className={getTabClass("/admin/gamification")}>
              <span className="text-purple-400 text-lg">★</span> {t("admin.tabGamification")}
            </Link>
            
            <Link href="/admin/audit" className={getTabClass("/admin/audit")}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> {t("admin.tabAudit")}
            </Link>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}
