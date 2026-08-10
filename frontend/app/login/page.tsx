"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import { Gamepad2 } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";

export default function LoginPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
        // Set cookies
        Cookies.set("token", data.token, { expires: 7 });
        Cookies.set("role", data.user.role, { expires: 7 });
        
        // Redirect based on role
        if (data.user.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/");
        }
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
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800 backdrop-blur-sm shadow-2xl">
        <div className="text-center">
          <Gamepad2 className="mx-auto h-12 w-12 text-blue-500" />
          <h2 className="mt-6 text-3xl font-extrabold">{t("login.title")}</h2>
          <p className="mt-2 text-sm text-zinc-400">
            {t("login.noAccount")}{" "}
            <Link href="/register" className="font-medium text-blue-500 hover:text-blue-400 transition-colors">
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
              <label className="block text-sm font-medium text-zinc-300 dark:text-zinc-300 text-zinc-700 mb-1">{t("login.email")}</label>
              <input
                type="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-border bg-card placeholder-zinc-500 text-foreground rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder={t("login.email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 dark:text-zinc-300 text-zinc-700 mb-1">{t("login.password")}</label>
              <input
                type="password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-border bg-card placeholder-zinc-500 text-foreground rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
            >
              {loading ? "..." : t("login.submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
