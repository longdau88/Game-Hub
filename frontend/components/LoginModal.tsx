"use client";

import { useState } from "react";
import Link from "next/link";
import { Gamepad2, X } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function LoginModal() {
  const { t } = useLanguage();
  const { isLoginModalOpen, closeLoginModal, login } = useAuth();
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isLoginModalOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        login(data.token, data.user.role, data.user);
        router.refresh();
      } else {
        const errorMsg = data.error || "Login failed";
        let mappedError = "error.default";
        
        if (errorMsg.includes("verify your email")) mappedError = "error.verifyEmail";
        else if (errorMsg.includes("Invalid email")) mappedError = "error.invalidCredentials";
        else if (errorMsg.includes("banned")) mappedError = "error.banned";
        
        setError(t(mappedError));
      }
    } catch (err) {
      setError(t("error.default"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="presentation" onMouseDown={() => closeLoginModal()}>
      <div 
        role="dialog" 
        aria-modal="true" 
        className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900" 
        onMouseDown={event => event.stopPropagation()}
      >
        <button 
          onClick={closeLoginModal} 
          className="absolute right-4 top-4 rounded-full p-2 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center">
          <Gamepad2 className="mx-auto h-12 w-12 text-blue-500" />
          <h2 className="mt-6 text-2xl font-extrabold text-zinc-900 dark:text-white">{t("login.title")}</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {t("login.noAccount")}{" "}
            <Link href="/register" onClick={closeLoginModal} className="font-medium text-blue-500 hover:text-blue-400 transition-colors">
              {t("login.registerLink")}
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-md text-sm text-center">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t("login.email")}</label>
              <input
                type="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 placeholder-zinc-500 text-zinc-900 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder={t("login.email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t("login.password")}</label>
              <input
                type="password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 placeholder-zinc-500 text-zinc-900 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder={t("login.password")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            >
              {loading ? "..." : t("login.submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
