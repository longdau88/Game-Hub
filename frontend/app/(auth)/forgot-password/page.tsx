"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gamepad2, Loader2, Mail, KeyRound } from "lucide-react";

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

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
        // Automatically redirect to login with a success parameter
        router.push("/login?reset=true");
      } else {
        setError(data.error || t("error.default"));
      }
    } catch (err) {
      setError(t("error.default"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6 w-full">
      <div className="flex flex-col space-y-2 text-center lg:text-left">
        <div className="lg:hidden flex justify-center mb-4">
          <Gamepad2 className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">{t("forgotPassword.title") || "Forgot Password"}</h1>
        <p className="text-sm text-muted-foreground">
          {step === 1 
            ? (t("forgotPassword.enterEmail") || "Enter your email to reset password") 
            : (t("register.checkEmail") || "Check your email for the verification code")}
        </p>
      </div>
      
      {step === 1 ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          {error && (
            <div className="p-3 text-sm font-medium bg-error/10 text-error rounded-md border border-error/20">
              {error}
            </div>
          )}

          <div className="space-y-2">
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
            <Link href="/login" className="w-1/3">
              <Button type="button" variant="outline" className="w-full" disabled={loading}>
                {t("creator.back") || "Back"}
              </Button>
            </Link>
            <Button type="submit" className="w-2/3" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("register.sendCode") || "Send Code"}
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-4">
          {successMsg && (
            <div className="p-3 text-sm font-medium bg-emerald-500/10 text-emerald-500 rounded-md border border-emerald-500/20 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {successMsg}
            </div>
          )}
          {error && (
            <div className="p-3 text-sm font-medium bg-error/10 text-error rounded-md border border-error/20">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
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

          <div className="space-y-2">
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

          <div className="space-y-2">
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

          <div className="flex gap-2 mt-4">
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

      <div className="text-center text-sm text-muted-foreground mt-4">
        {t("login.noAccount") || "Don't have an account?"}{" "}
        <Link href="/register" className="font-semibold text-primary hover:underline">
          {t("login.registerLink") || "Sign up"}
        </Link>
      </div>
    </div>
  );
}
