"use client";

import { useLanguage } from "../contexts/LanguageContext";
import { useEffect, useState } from "react";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-16 h-8 rounded-lg bg-zinc-100/50 dark:bg-zinc-800/50 animate-pulse"></div>;
  }

  return (
    <div className="flex items-center gap-1 p-1 bg-zinc-100/50 dark:bg-zinc-800/50 dark:bg-zinc-800/50 bg-gray-200 rounded-lg border border-zinc-300 dark:border-zinc-700 dark:border-zinc-700">
      <button
        onClick={() => setLocale("vi")}
        className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${
          locale === "vi" 
            ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm" 
            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-900 dark:text-white"
        }`}
        title="Tiếng Việt"
      >
        VN
      </button>
      <button
        onClick={() => setLocale("en")}
        className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${
          locale === "en" 
            ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm" 
            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-900 dark:text-white"
        }`}
        title="English"
      >
        EN
      </button>
    </div>
  );
}
