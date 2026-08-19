"use client";

import { SWRConfig } from "swr";
import { fetchAPI } from "@/lib/api";

const fetcher = (url: string) => fetchAPI(url).then(res => res.data || res);

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig 
      value={{ 
        fetcher,
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        errorRetryCount: 3
      }}
    >
      {children}
    </SWRConfig>
  );
}
