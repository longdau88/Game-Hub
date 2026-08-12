"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Check, Settings, LayoutDashboard, Gamepad2, Users, Tags, Flag, ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getTabClass = (path: string) => {
    return pathname === path
      ? "bg-primary/10 text-primary w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors";
  };

  const getSubTabClass = (path: string) => {
    return pathname === path
      ? "bg-primary/10 text-primary w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors pl-8"
      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors pl-8";
  };
  
  const getSubTabClassYellow = (path: string) => {
    return pathname === path
      ? "bg-yellow-500/10 text-yellow-500 w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors pl-8"
      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors pl-8";
  };

  const NavLinks = () => (
    <nav className="space-y-1">
      <div className="p-4 space-y-1">
        <Link href="/admin/dashboard" onClick={() => setSidebarOpen(false)} className={getTabClass("/admin/dashboard")}>
          <LayoutDashboard className="w-4 h-4" /> {t("admin.tabDashboard")}
        </Link>
        
        <div className="pt-2">
          <span className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">{t("admin.tabGames")}</span>
        </div>
        
        <Link href="/admin/games" onClick={() => setSidebarOpen(false)} className={getSubTabClass("/admin/games")}>
          <Gamepad2 className="w-4 h-4" /> {t("admin.tabGamesPublished")}
        </Link>
        
        <Link href="/admin/pending-games" onClick={() => setSidebarOpen(false)} className={getSubTabClassYellow("/admin/pending-games")}>
          <Check className="w-4 h-4" /> {t("admin.tabGamesPending")}
        </Link>
        
        <Link href="/admin/users" onClick={() => setSidebarOpen(false)} className={getTabClass("/admin/users")}>
          <Users className="w-4 h-4" /> {t("admin.tabUsers")}
        </Link>
        
        <Link href="/admin/reports" onClick={() => setSidebarOpen(false)} className={getTabClass("/admin/reports")}>
          <Flag className="w-4 h-4" /> {t("admin.tabReports")}
        </Link>
        
        <Link href="/admin/settings" onClick={() => setSidebarOpen(false)} className={getTabClass("/admin/settings")}>
          <Settings className="w-4 h-4" /> {t("admin.tabSettings")}
        </Link>
        
        <Link href="/admin/storage" onClick={() => setSidebarOpen(false)} className={getTabClass("/admin/storage")}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg> {t("admin.tabStorage")}
        </Link>
        
        <Link href="/admin/analytics" onClick={() => setSidebarOpen(false)} className={getTabClass("/admin/analytics")}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> {t("admin.tabAnalytics")}
        </Link>
        
        <Link href="/admin/mail" onClick={() => setSidebarOpen(false)} className={getTabClass("/admin/mail")}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> {t("admin.tabMail")}
        </Link>
        
        <Link href="/admin/categories" onClick={() => setSidebarOpen(false)} className={getTabClass("/admin/categories")}>
          <Tags className="w-4 h-4" /> {t("admin.tabCategories")}
        </Link>
        
        <Link href="/admin/gamification" onClick={() => setSidebarOpen(false)} className={getTabClass("/admin/gamification")}>
          <span className="text-purple-400 text-lg">★</span> {t("admin.tabGamification")}
        </Link>
        
        <Link href="/admin/audit" onClick={() => setSidebarOpen(false)} className={getTabClass("/admin/audit")}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> {t("admin.tabAudit")}
        </Link>
      </div>
    </nav>
  );

  return (
    <div className="py-4 sm:py-8 w-full px-4 lg:px-8 max-w-7xl mx-auto flex flex-col md:flex-row gap-4 md:gap-8">
      
      {/* Mobile Sidebar Toggle */}
      <div className="md:hidden">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-medium text-sm"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-primary" />
            <span>{t("admin.title")} — Navigation</span>
          </div>
          {sidebarOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {sidebarOpen && (
          <div className="mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
            <NavLinks />
          </div>
        )}
      </div>

      {/* Desktop Sidebar Navigation */}
      <aside className="hidden md:block w-64 shrink-0 sticky top-8 self-start max-h-[calc(100vh-4rem)] overflow-y-auto scrollbar-hide pr-2">
        <div className="flex items-center gap-3 mb-8 px-2">
          <Settings className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold">{t("admin.title")}</h1>
        </div>
        <NavLinks />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}

