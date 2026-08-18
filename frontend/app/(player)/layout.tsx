"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gamepad2, Home, Compass, Library, FolderHeart, Users, Trophy, Bell, Settings, LogOut, ChevronRight, Menu, X, CheckSquare } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

const NAVIGATION = [
  { nameKey: "nav.home", defaultName: "Home", href: "/", icon: Home },
  { nameKey: "nav.discover", defaultName: "Discover", href: "/discover", icon: Compass },
  { nameKey: "nav.library", defaultName: "Library", href: "/library", icon: Library },
  { nameKey: "nav.collections", defaultName: "Collections", href: "/collections", icon: FolderHeart },
];

const SOCIAL = [
  { nameKey: "nav.friends", defaultName: "Friends", href: "/friends", icon: Users },
  { nameKey: "nav.leaderboards", defaultName: "Leaderboards", href: "/leaderboards", icon: Trophy },
  { nameKey: "nav.quests", defaultName: "Quests", href: "/quests", icon: CheckSquare },
];

function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]); // Empty array means no notifications = no red dot
  const { t } = useLanguage();
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={bellRef}>
      <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="relative">
        <Bell className="w-5 h-5" />
        {notifications.length > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full" />
        )}
      </Button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-surface border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
            <h3 className="font-semibold">{t("notif.title") || "Notifications"}</h3>
            {notifications.length > 0 && (
              <button className="text-xs text-primary hover:underline">
                {t("notif.markAllRead") || "Mark all read"}
              </button>
            )}
          </div>
          <div className="p-4 max-h-[300px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground flex flex-col items-center gap-2">
                <Bell className="w-8 h-8 opacity-20 mx-auto" />
                <p className="text-sm">{t("notif.noNotifications") || "No notifications"}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Real notifications would map here */}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PlayerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useLanguage();
  const { profile: user, role, openLoginModal } = useAuth();

  return (
    <div className="flex h-[100dvh] flex-col lg:flex-row w-full bg-background overflow-hidden">
      {/* Mobile Topbar */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-surface sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-primary p-2 rounded-lg">
            <Gamepad2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg tracking-tight">GameHub</span>
        </Link>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <Avatar size="sm" fallback="U" className="cursor-pointer" />
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 flex-col bg-surface border-r border-border transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:flex lg:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="hidden lg:flex items-center gap-3 p-6 pb-2">
          <div className="bg-primary p-2.5 rounded-xl shadow-lg shadow-primary/20">
            <Gamepad2 className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-foreground">GameHub</span>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
          {/* Main Nav */}
          <nav className="space-y-1">
            {NAVIGATION.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.nameKey}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                  {t(item.nameKey) || item.defaultName}
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                </Link>
              );
            })}
          </nav>

          {/* Social Nav */}
          <div>
            <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {t("nav.community") || "Community"}
            </h3>
            <nav className="space-y-1">
              {SOCIAL.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.nameKey}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                      isActive 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                    {t(item.nameKey) || item.defaultName}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Admin Nav */}
          {(role === 'admin' || role === 'ADMIN') && (
            <div>
              <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Admin
              </h3>
              <nav className="space-y-1">
                <Link
                  href="/admin"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <Settings className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                  Admin Dashboard
                </Link>
              </nav>
            </div>
          )}
        </div>

        {/* User Profile Area */}
        <div className="p-4 border-t border-border bg-surface/50">
          {user ? (
            <Link href="/profile" className="block">
              <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-secondary cursor-pointer transition-colors">
                <Avatar size="md" fallback={user?.username?.[0]?.toUpperCase() || "U"} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{user?.username}</p>
                  <p className="text-xs text-primary font-medium">{t("nav.level") || "Level"} {user?.level || 1}</p>
                </div>
              </div>
            </Link>
          ) : (
            <Button onClick={openLoginModal} className="w-full">
              {t("nav.login") || "Đăng nhập"}
            </Button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Desktop Topbar */}
        <header className="hidden lg:flex items-center justify-end h-20 px-8 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-secondary/50 px-4 py-1.5 rounded-full border border-border">
              {user?.streak > 0 && <div className="w-2 h-2 rounded-full bg-success animate-pulse" />}
              <span className="text-xs font-medium text-muted-foreground">
                {user?.streak ? `${user.streak} ${t("nav.streak_days") || "Day Streak!"}` : t("nav.no_streak") || "No Active Streak"}
              </span>
            </div>
            
            <div className="flex items-center gap-1 border-r border-border pr-4 mr-2">
              <ThemeToggle />
              <LanguageSwitcher />
            </div>

            <NotificationBell />
            <Link href="/creator/games/new" className="hidden sm:flex">
              <Button variant="outline" className="w-full">
                {t("nav.submitGame") || "Submit Game"}
              </Button>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
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
