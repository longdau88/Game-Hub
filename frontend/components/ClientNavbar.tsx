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
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!mounted) return null;

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
  };

  return (
    <div className="flex items-center gap-2 sm:gap-4 relative" ref={menuRef}>
      <LanguageSwitcher />
      <ThemeSwitcher />
      
      {!token ? (
        <button
          onClick={openLoginModal}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-colors"
        >
          {t("nav.login")}
        </button>
      ) : (
        <>
          <NotificationDropdown />
          
          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            {role === "admin" && (
              <Link href="/admin" className="flex items-center gap-2 px-4 py-2 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white text-sm font-medium transition-colors">
                <Settings className="w-4 h-4" /> {t("nav.admin")}
              </Link>
            )}
            <Link href="/creator/upload" className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
              <UploadCloud className="w-4 h-4" /> {t("nav.uploadGame")}
            </Link>
            {profile && (
              <div className="flex items-center gap-2 mr-2 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700" title={`XP: ${profile.xp || 0}`}>
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span className="text-xs font-bold text-zinc-900 dark:text-white">Lvl {profile.level || 1}</span>
                <div className="w-16 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden ml-1">
                  <div className="h-full bg-yellow-500" style={{ width: `${((profile.xp || 0) % 100)}%` }} />
                </div>
              </div>
            )}
            <Link href="/profile" className="flex items-center gap-2 px-4 py-2 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white text-sm font-medium transition-colors">
              <User className="w-4 h-4" /> {t("nav.profile")}
            </Link>
            <a href="#" onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-md border border-border hover:bg-zinc-200 dark:hover:bg-zinc-800 text-sm font-medium transition-colors cursor-pointer">
              <LogOut className="w-4 h-4" /> {t("nav.logout")}
            </a>
          </div>

          {/* Mobile Navigation Dropdown */}
          {menuOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden flex flex-col md:hidden z-50">
              {role === "admin" && (
                <Link href="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-800 text-sm font-medium">
                  <Settings className="w-4 h-4" /> {t("nav.admin")}
                </Link>
              )}
              <Link href="/creator/upload" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-800 text-sm font-medium text-blue-600 dark:text-blue-400">
                <UploadCloud className="w-4 h-4" /> {t("nav.uploadGame")}
              </Link>
              <Link href="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-800 text-sm font-medium">
                <User className="w-4 h-4" /> {t("nav.profile")}
              </Link>
              <a href="#" onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-medium text-red-500">
                <LogOut className="w-4 h-4" /> {t("nav.logout")}
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}
