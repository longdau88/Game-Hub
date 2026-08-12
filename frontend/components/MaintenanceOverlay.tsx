"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { Wrench } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

export default function MaintenanceOverlay({ children }: { children?: React.ReactNode }) {
  const { t } = useLanguage();
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mounted, setMounted] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => {
    setMounted(true);
    const checkStatus = async () => {
      try {
        const role = Cookies.get("role");
        setIsAdmin(role === "admin");
        
        const res = await fetch(`${apiUrl}/api/system/status`);
        if (res.ok) {
          const data = await res.json();
          if (data.maintenanceMode) {
            setIsMaintenance(true);
          } else {
            setIsMaintenance(false);
          }
        }
      } catch (err) {
        console.error("Failed to check system status", err);
      }
    };

    checkStatus();
    // Poll every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, [apiUrl]);

  if (!mounted) return <>{children}</>;
  if (!isMaintenance || isAdmin) return <>{children}</>;

  return (
    <div className="flex flex-col items-center justify-center flex-1 w-full py-20 text-center animate-in fade-in duration-300">
      <div className="bg-primary/10 p-6 rounded-full mb-8">
        <Wrench className="w-16 h-16 text-primary animate-pulse" />
      </div>
      
      <h1 className="text-4xl font-bold mb-4 tracking-tight">
        {t("system.maintenanceTitle") || "Hệ Thống Đang Bảo Trì"}
      </h1>
      
      <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-lg mx-auto mb-8 leading-relaxed">
        {t("system.maintenanceDesc") || "Chúng tôi đang tiến hành nâng cấp hệ thống để mang lại trải nghiệm tốt hơn. Vui lòng quay lại sau ít phút!"}
      </p>

      <div className="flex gap-4">
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          {t("system.maintenanceReload") || "Tải lại trang"}
        </button>
      </div>
    </div>
  );
}
