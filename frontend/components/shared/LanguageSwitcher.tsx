"use client"

import * as React from "react"
import { Globe } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import { Button } from "@/components/ui/button"

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage()

  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-2"
      onClick={() => setLocale(locale === "en" ? "vi" : "en")}
      title="Toggle language"
    >
      <Globe className="h-4 w-4 text-muted-foreground" />
      <span className="font-semibold text-xs uppercase">{locale}</span>
    </Button>
  )
}
