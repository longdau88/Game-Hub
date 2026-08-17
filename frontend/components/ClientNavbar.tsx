"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Settings, User, UploadCloud, Menu, X, Star } from "lucide-react";
import Cookies from "js-cookie";
import ThemeSwitcher from "./ThemeSwitcher";
import LanguageSwitcher from "./LanguageSwitcher";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import NotificationDropdown from "./NotificationDropdown";

export default function ClientNavbar() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const { token, role, profile, logout, openLoginModal } = useAuth();
  
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Close menu when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    
    // Close menu when scrolling
    function handleScroll() {
      if (menuOpen) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, { passive: true });
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [menuOpen]);

  if (!mounted) return null;

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
  };

  return (
    <div className="flex items-center relative" ref={menuRef}>
      {/* Mobile Menu Toggle (Always visible on mobile) */}
      <button 
        className="p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ml-2"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Navigation Dropdown */}
      {menuOpen && (
        <div className="absolute top-full right-0 mt-4 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col z-50 pb-2">
          
          <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800 flex flex-col gap-3 pt-4 pb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">{t("nav.settings")}</span>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("nav.theme")}</span>
              <ThemeSwitcher />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("nav.language")}</span>
              <LanguageSwitcher />
            </div>
          </div>
          
          {!token ? (
            <button onClick={() => { setMenuOpen(false); openLoginModal(); }} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-medium text-blue-600 dark:text-blue-400">
              <User className="w-4 h-4" /> {t("nav.login")}
            </button>
          ) : (
            <>
              <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("nav.notifications")}</span>
                <NotificationDropdown />
              </div>

              {profile && (
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" /> Lvl {profile.level || 1}
                  </span>
                  <div className="w-20 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500" style={{ width: `${((profile.xp || 0) % 100)}%` }} />
                  </div>
                </div>
              )}
              
              {role === "admin" && (
                <Link href="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  <Settings className="w-4 h-4" /> {t("nav.admin")}
                </Link>
              )}
              <Link href="/creator/upload" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-medium text-blue-600 dark:text-blue-400">
                <UploadCloud className="w-4 h-4" /> {t("nav.uploadGame")}
              </Link>
              <Link href="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                <User className="w-4 h-4" /> {t("nav.profile")}
              </Link>
              <a href="#" onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-medium text-red-500">
                <LogOut className="w-4 h-4" /> {t("nav.logout")}
              </a>
            </>
          )}
        </div>
      )}
    </div>
  );
}
