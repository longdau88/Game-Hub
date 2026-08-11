"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

export default function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-8 h-8 rounded-lg bg-zinc-100/50 dark:bg-zinc-800/50 animate-pulse"></div>;
  }

  return (
    <div className="flex items-center gap-1 p-1 bg-zinc-100/50 dark:bg-zinc-800/50 dark:bg-zinc-800/50 bg-gray-200 rounded-lg border border-zinc-300 dark:border-zinc-700 dark:border-zinc-700">
      <button
        onClick={() => setTheme("light")}
        className={`p-1.5 rounded-md transition-colors ${
          theme === "light" 
            ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm" 
            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-900 dark:text-white"
        }`}
        title="Light Mode"
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`p-1.5 rounded-md transition-colors ${
          theme === "dark" 
            ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm" 
            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-900 dark:text-white"
        }`}
        title="Dark Mode"
      >
        <Moon className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme("system")}
        className={`p-1.5 rounded-md transition-colors ${
          theme === "system" 
            ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm" 
            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-900 dark:text-white"
        }`}
        title="System Preference"
      >
        <Monitor className="w-4 h-4" />
      </button>
    </div>
  );
}
