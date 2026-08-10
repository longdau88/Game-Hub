"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Gamepad2, CheckCircle2 } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";

export default function RegisterPage() {
  const { t } = useLanguage();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [code, setCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Handle OTP countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendOtp = async () => {
    if (!email) {
      setError(t("error.missingFields"));
      return;
    }
    setError("");
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        setCountdown(60);
      } else {
        const errorMsg = data.error || "Failed to send OTP";
        let mappedError = "error.default";
        if (errorMsg.includes("already exists")) mappedError = "error.userExists";
        setError(t(mappedError));
      }
    } catch (err) {
      setError(t("error.default"));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, code }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
      } else {
        const errorMsg = data.error || "Registration failed";
        let mappedError = "error.default";
        
        if (errorMsg.includes("already exists")) mappedError = "error.userExists";
        else if (errorMsg.includes("Missing required fields")) mappedError = "error.missingFields";
        else if (errorMsg.includes("first")) mappedError = "error.needOtp";
        else if (errorMsg.includes("Invalid verification")) mappedError = "error.invalidOtp";
        else if (errorMsg.includes("expired")) mappedError = "error.expiredOtp";
        
        setError(t(mappedError));
      }
    } catch (err) {
      setError(t("error.default"));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center space-y-6 bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800 backdrop-blur-sm shadow-2xl">
          <div className="mx-auto w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold">{t("register.success")}</h2>
          <div className="pt-4">
            <Link href="/login" className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md font-medium transition-colors inline-block">
              {t("nav.login")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800 backdrop-blur-sm shadow-2xl">
        <div className="text-center">
          <Gamepad2 className="mx-auto h-12 w-12 text-blue-500" />
          <h2 className="mt-6 text-3xl font-extrabold">{t("register.title")}</h2>
          <p className="mt-2 text-sm text-zinc-400">
            {t("register.hasAccount")}{" "}
            <Link href="/login" className="font-medium text-blue-500 hover:text-blue-400 transition-colors">
              {t("register.loginLink")}
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-md text-sm text-center">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 dark:text-zinc-300 text-zinc-700 mb-1">{t("register.username")}</label>
              <input
                type="text"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-border bg-card placeholder-zinc-500 text-foreground rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder={t("register.username")}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 dark:text-zinc-300 text-zinc-700 mb-1">{t("register.email")}</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-border bg-card placeholder-zinc-500 text-foreground rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder={t("register.email")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={countdown > 0}
                />
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading || countdown > 0 || !email}
                  className="whitespace-nowrap px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50 disabled:bg-zinc-600 transition-colors"
                >
                  {countdown > 0 ? t("register.resendCode").replace("{s}", countdown.toString()) : t("register.sendCode")}
                </button>
              </div>
            </div>

            {otpSent && (
              <div>
                <label className="block text-sm font-medium text-zinc-300 dark:text-zinc-300 text-zinc-700 mb-1">{t("register.code")}</label>
                <input
                  type="text"
                  required
                  maxLength={8}
                  className="appearance-none relative block w-full px-3 py-2 border border-border bg-card placeholder-zinc-500 text-foreground rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-center font-mono tracking-widest uppercase"
                  placeholder="XXXXXXXX"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-zinc-300 dark:text-zinc-300 text-zinc-700 mb-1">{t("register.password")}</label>
              <input
                type="password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-border bg-card placeholder-zinc-500 text-foreground rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder={t("register.password")}
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
              {loading ? "..." : t("register.submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
