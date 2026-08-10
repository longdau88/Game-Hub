"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
import Cookies from "js-cookie";

export default function ClientNavbar() {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setToken(Cookies.get("token") || null);
    setRole(Cookies.get("role") || null);
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    Cookies.remove("token");
    Cookies.remove("role");
    window.location.href = "/login";
  };

  return (
    <div className="flex items-center gap-4">
      {!token ? (
        <Link
          href="/login"
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-sm font-medium transition-colors"
        >
          Sign in
        </Link>
      ) : (
        <>
          {role === "admin" && (
            <Link
              href="/admin"
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-sm font-medium transition-colors"
            >
              <Settings className="w-4 h-4" />
              Admin
            </Link>
          )}
          <a
            href="#"
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-md border border-zinc-800 hover:bg-zinc-800 text-sm font-medium transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </a>
        </>
      )}
    </div>
  );
}
