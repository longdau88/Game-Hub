"use client";

import { useState } from "react";
import { Gamepad2, Loader2, Mail, X } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { useAppDialog } from "../contexts/DialogContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export default function ForgotPasswordModal() {
  const { t } = useLanguage();
  const { isForgotPasswordModalOpen, closeForgotPasswordModal, openLoginModal, openRegisterModal } = useAuth();
  const { notify } = useAppDialog();
  
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isForgotPasswordModalOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setStep(2);
        setSuccessMsg(t("forgotPassword.emailSent") || "Password reset code sent to your email.");
      } else {
        if (res.status === 404 && data.error && data.error.includes("No corresponding account")) {
          setError(t("forgotPassword.noAccount") || data.error);
        } else {
          setError(data.error || t("error.default"));
        }
      }
    } catch (err) {
      setError(t("error.default"));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        notify({
          variant: "success",
          title: t("dialog.noticeTitle"),
          message: t("forgotPassword.success") || "Password reset successfully. You can now log in.",
        });
        closeForgotPasswordModal();
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
    closeForgotPasswordModal();
    openLoginModal();
  };

  const handleRegisterClick = () => {
    closeForgotPasswordModal();
    openRegisterModal();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="presentation" onMouseDown={() => closeForgotPasswordModal()}>
      <div 
        role="dialog" 
        aria-modal="true" 
        className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900" 
        onMouseDown={event => event.stopPropagation()}
      >
        <button 
          onClick={closeForgotPasswordModal} 
          className="absolute right-4 top-4 rounded-full p-2 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center">
          <Gamepad2 className="mx-auto h-12 w-12 text-primary" />
          <h2 className="mt-6 text-2xl font-extrabold text-zinc-900 dark:text-white">{t("forgotPassword.title") || "Forgot Password"}</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {step === 1 
              ? (t("forgotPassword.enterEmail") || "Enter your email to reset password") 
              : (t("register.checkEmail") || "Check your email for the verification code")}
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
              <Label htmlFor="email">{t("login.email")}</Label>
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

            <div className="flex gap-2">
              <Button type="button" variant="outline" className="w-1/3" disabled={loading} onClick={handleLoginClick}>
                {t("creator.back") || "Back"}
              </Button>
              <Button type="submit" className="w-2/3" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("register.sendCode") || "Send Code"}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="mt-8 space-y-4">
            {successMsg && (
              <div className="p-3 text-sm font-medium bg-emerald-500/10 text-emerald-500 rounded-md border border-emerald-500/20 flex items-center gap-2 justify-center">
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
              <Label htmlFor="code">{t("register.code") || "Verification Code"}</Label>
              <Input
                id="code"
                type="text"
                placeholder={t("register.enterCode") || "Enter the 8-character code"}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                disabled={loading}
                className="text-center tracking-widest uppercase font-mono text-lg"
                maxLength={8}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="newPassword">{t("forgotPassword.newPassword") || "New Password"}</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="confirmPassword">{t("forgotPassword.confirmPassword") || "Confirm Password"}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" className="w-1/3" disabled={loading} onClick={() => setStep(1)}>
                {t("creator.back") || "Back"}
              </Button>
              <Button type="submit" className="w-2/3" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("forgotPassword.submit") || "Reset Password"}
              </Button>
            </div>
          </form>
        )}

        <div className="text-center text-sm text-zinc-600 dark:text-zinc-400 mt-6">
          {t("login.noAccount") || "Don't have an account?"}{" "}
          <button type="button" onClick={handleRegisterClick} className="font-semibold text-primary hover:underline transition-colors">
            {t("login.registerLink") || "Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}
