"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Gamepad2, LineChart, Wallet, Settings, Bell, Upload, HelpCircle, ChevronRight, Menu, X, ArrowLeft, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAppDialog } from "@/contexts/DialogContext";
import NotificationDropdown from "@/components/NotificationDropdown";

const NAVIGATION = [
  { nameKey: "admin.tabDashboard", defaultName: "Dashboard", href: "/creator/dashboard", icon: LayoutDashboard },
  { nameKey: "profile.uploadedGames", defaultName: "My Games", href: "/creator/games", icon: Gamepad2 },
  { nameKey: "admin.tabAnalytics", defaultName: "Analytics", href: "/creator/analytics", icon: LineChart },
];

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { profile: user, logout } = useAuth();
  const { t } = useLanguage();
  const { notify } = useAppDialog();

  return (
    <div className="flex h-screen overflow-hidden flex-col lg:flex-row w-full bg-background">
      {/* Mobile Topbar */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-surface sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-primary p-2 rounded-lg">
            <Gamepad2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg tracking-tight">Studio</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 flex-col bg-surface border-r border-border transition-transform duration-300 ease-in-out lg:static lg:flex lg:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center gap-3 p-6 pb-2">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-xl shadow-lg">
            <Gamepad2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-foreground block">{t("creator.studio") || "Creator Studio"}</span>
            <Link href="/" className="text-xs text-muted-foreground hover:text-primary flex items-center mt-0.5">
              <ArrowLeft className="w-3 h-3 mr-1" /> {t("creator.backToGameHub") || "Back to GameHub"}
            </Link>
          </div>
        </div>

        <div className="flex-1 py-8 px-4 flex flex-col justify-between">
          <nav className="space-y-1.5">
            {NAVIGATION.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.nameKey}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                    isActive 
                      ? "bg-indigo-500/10 text-indigo-400" 
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", isActive ? "text-indigo-400" : "text-muted-foreground group-hover:text-foreground")} />
                  {t(item.nameKey) || item.defaultName}
                </Link>
              );
            })}
          </nav>
          
          <div className="mt-auto space-y-4">
            <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <h4 className="font-bold text-sm text-indigo-400 mb-2">{t("creator.needHelp") || "Need Help?"}</h4>
              <p className="text-xs text-muted-foreground mb-3">{t("creator.needHelpDesc") || "Check out our creator documentation and guidelines."}</p>
              <Link href="/creator/docs" className="block w-full">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  <HelpCircle className="w-4 h-4 mr-2" />{t("creator.documentation") || "Documentation"}
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center gap-3 p-2 rounded-xl border border-border bg-background">
              <Avatar size="sm" src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'Guest'}`} fallback={user?.username?.[0]?.toUpperCase() || "U"} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{user?.username || t("nav.guest") || "Guest"}</p>
                <p className="text-xs text-muted-foreground">{user?.role === 'CREATOR' ? 'Creator' : 'Pro Creator'}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => logout()} title={t("nav.logout") || "Log out"}>
                <LogOut className="w-4 h-4 text-muted-foreground hover:text-error transition-colors" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
        {/* Desktop Topbar */}
        <header className="hidden lg:flex shrink-0 items-center justify-between h-20 px-8 border-b border-border bg-background/95 backdrop-blur sticky top-0 z-30">
          <h1 className="text-xl font-bold">
            {t(NAVIGATION.find(n => pathname.startsWith(n.href))?.nameKey || "") || NAVIGATION.find(n => pathname.startsWith(n.href))?.defaultName || "Dashboard"}
          </h1>
          <div className="flex items-center gap-4">
            
            <div className="flex items-center gap-1 border-r border-border pr-4 mr-2">
              <ThemeToggle />
              <LanguageSwitcher />
            </div>

            <NotificationDropdown />
            <Link href="/creator/games/new">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-lg shadow-indigo-500/20">
                <Upload className="w-4 h-4 mr-2" /> {t("creator.uploadGame") || "Upload Game"}
              </Button>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
