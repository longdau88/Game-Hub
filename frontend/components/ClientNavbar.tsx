"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogOut, Settings, User } from "lucide-react";
import Cookies from "js-cookie";
import ThemeSwitcher from "./ThemeSwitcher";
import LanguageSwitcher from "./LanguageSwitcher";
import { useLanguage } from "../contexts/LanguageContext";

export default function ClientNavbar() {
  const { t } = useLanguage();
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setToken(Cookies.get("token") || null);
    setRole(Cookies.get("role") || null);
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    Cookies.remove("token");
    Cookies.remove("role");
    window.location.href = "/login";
  };

  return (
    <div className="flex items-center gap-4">
      <LanguageSwitcher />
      <ThemeSwitcher />
      
      {!token ? (
        <Link
          href="/login"
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-colors"
        >
          {t("nav.login")}
        </Link>
      ) : (
        <>
          {role === "admin" && (
            <Link
              href="/admin"
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-zinc-800 dark:bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium transition-colors"
            >
              <Settings className="w-4 h-4" />
              {t("nav.admin")}
            </Link>
          )}
          <Link
            href="/profile"
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-zinc-800 dark:bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium transition-colors"
          >
            <User className="w-4 h-4" />
            Profile
          </Link>
          <a
            href="#"
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-md border border-border hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-medium transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            {t("nav.logout")}
          </a>
        </>
      )}
    </div>
  );
}
