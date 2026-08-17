"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import Cookies from "js-cookie";
import en from "../locales/en.json";
import vi from "../locales/vi.json";

type Locale = "en" | "vi";
type Translations = Record<string, string>;

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const translations: Record<Locale, Translations> = { en, vi };

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ 
  children, 
  initialLocale = "en" 
}: { 
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  // Sync client state with cookie on mount, in case initialLocale didn't match client reality
  useEffect(() => {
    const savedLocale = Cookies.get("NEXT_LOCALE") as Locale;
    if (savedLocale && (savedLocale === "en" || savedLocale === "vi")) {
      setLocaleState(savedLocale);
    } else {
      // If no saved locale, detect via IP
      fetch("https://ipapi.co/json/")
        .then(res => res.json())
        .then(data => {
          if (data.country_code === "VN") {
            setLocale("vi");
          } else {
            setLocale("en");
          }
        })
        .catch(() => {
          // Fallback to initialLocale on error
          setLocaleState(initialLocale);
        });
    }
  }, [initialLocale]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    Cookies.set("NEXT_LOCALE", newLocale, { expires: 365, path: "/" });
  };

  const t = (key: string): string => {
    return translations[locale]?.[key] || "";
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
