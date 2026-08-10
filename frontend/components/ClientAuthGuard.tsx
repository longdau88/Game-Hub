"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Cookies from "js-cookie";

export default function ClientAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = Cookies.get("token");
    const role = Cookies.get("role");

    const isAuthPage = pathname === "/login" || pathname === "/register" || pathname.startsWith("/verify-email");

    if (isAuthPage && token) {
      if (role === "admin") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } else if (!isAuthPage && !token) {
      router.push("/login");
    } else if (pathname.startsWith("/admin") && role !== "admin") {
      router.push("/");
    } else {
      setAuthorized(true);
    }
  }, [pathname, router]);

  if (!authorized) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
  }

  return <>{children}</>;
}
