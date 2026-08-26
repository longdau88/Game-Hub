"use client";

import { useEffect } from "react";

export default function AdSense({ clientId }: { clientId: string }) {
  useEffect(() => {
    if (document.getElementById("adsbygoogle-init")) return;
    
    const script = document.createElement("script");
    script.id = "adsbygoogle-init";
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
    script.async = true;
    script.crossOrigin = "anonymous";
    document.head.appendChild(script);
  }, [clientId]);

  return null;
}
