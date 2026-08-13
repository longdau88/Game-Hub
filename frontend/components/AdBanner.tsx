"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

interface AdBannerProps {
  dataAdSlot: string;
  dataAdFormat?: string;
  dataFullWidthResponsive?: boolean;
  className?: string;
}

export default function AdBanner({
  dataAdSlot,
  dataAdFormat = "auto",
  dataFullWidthResponsive = true,
  className = "",
}: AdBannerProps) {
  const pathname = usePathname();
  const adRef = useRef<HTMLModElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    // Reset initialization when route changes if needed, 
    // but typically adsbygoogle handles this.
    try {
      if (adRef.current && !initialized.current) {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        initialized.current = true;
      }
    } catch (err) {
      console.error("AdSense error:", err);
    }
  }, [pathname]);

  // If in development, maybe just show a placeholder
  if (process.env.NODE_ENV === "development") {
    return (
      <div className={`bg-zinc-100 dark:bg-zinc-800 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl flex items-center justify-center text-zinc-400 text-sm font-medium ${className}`}>
        Advertisement Placeholder
      </div>
    );
  }

  return (
    <ins
      ref={adRef}
      className={`adsbygoogle ${className}`}
      style={{ display: "block" }}
      data-ad-client="ca-pub-7121527745227718"
      data-ad-slot={dataAdSlot}
      data-ad-format={dataAdFormat}
      data-full-width-responsive={dataFullWidthResponsive}
    />
  );
}
