"use client";

import { useLanguage } from "../contexts/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="w-full py-6 mt-12 border-t border-zinc-200 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center items-center">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {t("footer.builtBy")}
        </p>
      </div>
    </footer>
  );
}
