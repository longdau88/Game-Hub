"use client";

import { useState } from "react";
import { Gamepad2, Loader2, Mail, X } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { useAppDialog } from "../contexts/DialogContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export default function RegisterModal() {
  const { t } = useLanguage();
  const { isRegisterModalOpen, closeRegisterModal, openLoginModal } = useAuth();
  const { notify } = useAppDialog();
  
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isRegisterModalOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username }),
      });

      const data = await res.json();

      if (res.ok) {
        setStep(2);
        setSuccessMsg(t("register.otpSent"));
      } else {
        setError(data.error || t("error.default"));
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
        notify({
          variant: "success",
          title: t("dialog.noticeTitle"),
          message: "Registration successful. You can now log in.",
        });
        closeRegisterModal();
        openLoginModal();
      } else {
        setError(data.error || t("error.default"));
      }
    } catch (err) {
      setError(t("error.default"));
    } finally {
      setLoading(false);
    }
  };

  const handleLoginClick = () => {
    closeRegisterModal();
    openLoginModal();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="presentation" onMouseDown={() => closeRegisterModal()}>
      <div 
        role="dialog" 
        aria-modal="true" 
        className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900" 
        onMouseDown={event => event.stopPropagation()}
      >
        <button 
          onClick={closeRegisterModal} 
          className="absolute right-4 top-4 rounded-full p-2 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center">
          <Gamepad2 className="mx-auto h-12 w-12 text-primary" />
          <h2 className="mt-6 text-2xl font-extrabold text-zinc-900 dark:text-white">{t("register.title")}</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {step === 1 ? t("register.enterDetails") : t("register.checkEmail")}
          </p>
        </div>
        
        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="mt-8 space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-md text-sm text-center">
                {error}
              </div>
            )}
            
            <div className="space-y-1">
              <Label htmlFor="username">{t("register.username")}</Label>
              <Input
                id="username"
                type="text"
                placeholder="gamer123"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="email">{t("register.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="password">{t("register.password")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading} size="lg">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("register.sendCode")}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="mt-8 space-y-4">
            {successMsg && (
              <div className="p-3 text-sm font-medium bg-emerald-500/10 text-emerald-500 rounded-md border border-emerald-500/20 flex items-center justify-center gap-2">
                <Mail className="w-4 h-4" />
                {successMsg}
              </div>
            )}
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-md text-sm text-center">
                {error}
              </div>
            )}
            
            <div className="space-y-1">
              <Label htmlFor="code">{t("register.code")}</Label>
              <Input
                id="code"
                type="text"
                placeholder={t("register.enterCode")}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                disabled={loading}
                className="text-center tracking-widest uppercase font-mono text-lg"
                maxLength={8}
              />
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" className="w-1/3" disabled={loading} onClick={() => setStep(1)}>
                {t("creator.back")}
              </Button>
              <Button type="submit" className="w-2/3" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("register.submit")}
              </Button>
            </div>
          </form>
        )}

        <div className="text-center text-sm text-zinc-600 dark:text-zinc-400 mt-6">
          {t("register.hasAccount")}{" "}
          <button type="button" onClick={handleLoginClick} className="font-medium text-primary hover:underline transition-colors">
            {t("register.loginLink")}
          </button>
        </div>
      </div>
    </div>
  );
}
