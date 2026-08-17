"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Gamepad2, ShieldAlert, LineChart, Settings, Bell, Menu, X, Server, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";

const NAVIGATION = [
  { name: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "User Management", href: "/admin/users", icon: Users },
  { name: "Games & Content", href: "/admin/games", icon: Gamepad2 },
  { name: "Moderation", href: "/admin/moderation", icon: ShieldAlert },
  { name: "System Metrics", href: "/admin/metrics", icon: LineChart },
  { name: "Infrastructure", href: "/admin/infrastructure", icon: Server },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <div className="flex min-h-screen flex-col lg:flex-row w-full bg-background">
      {/* Mobile Topbar */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-surface sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-error p-2 rounded-lg">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">Admin Console</span>
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
          <div className="bg-error p-2.5 rounded-xl shadow-lg shadow-error/20">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-foreground block">Admin Console</span>
            <Link href="/" className="text-xs text-muted-foreground hover:text-primary flex items-center mt-0.5">
              <ArrowLeft className="w-3 h-3 mr-1" /> Exit Admin
            </Link>
          </div>
        </div>

        <div className="flex-1 py-8 px-4 overflow-y-auto space-y-8">
          <nav className="space-y-1.5">
            {NAVIGATION.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                    isActive 
                      ? "bg-error/10 text-error" 
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", isActive ? "text-error" : "text-muted-foreground group-hover:text-foreground")} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        
        {/* Profile Area */}
        <div className="p-4 border-t border-border bg-surface/50">
          <div className="flex items-center gap-3 p-2 rounded-xl">
            <Avatar size="sm" fallback="SA" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">Super Admin</p>
              <p className="text-xs text-error font-bold">System Role</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
        {/* Desktop Topbar */}
        <header className="hidden lg:flex items-center justify-between h-20 px-8 border-b border-border bg-background/95 backdrop-blur sticky top-0 z-30">
          <h1 className="text-xl font-bold">
            {t(NAVIGATION.find(n => pathname.startsWith(n.href))?.name?.toLowerCase().replace(/ /g, '_') || "dashboard") || NAVIGATION.find(n => pathname.startsWith(n.href))?.name || "Dashboard"}
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-success/10 px-4 py-1.5 rounded-full border border-success/20">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs font-bold text-success">{t("system_nominal") || "System Nominal"}</span>
            </div>
            
            <div className="flex items-center gap-1 border-r border-border pr-4 mr-2">
              <ThemeToggle />
              <LanguageSwitcher />
            </div>

            <Button variant="ghost" size="icon" className="relative text-muted-foreground">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full" />
            </Button>
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
