"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gamepad2, Loader2, Mail } from "lucide-react";

export default function RegisterPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  
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
      const res = await fetch(`${apiUrl}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username }),
      });

      const data = await res.json();

      if (res.ok) {
        setStep(2);
        setSuccessMsg(data.message || "Verification code sent to your email.");
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
        router.push("/login?registered=true");
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
        <h1 className="text-3xl font-semibold tracking-tight">Create an account</h1>
        <p className="text-sm text-muted-foreground">
          {step === 1 ? "Enter your details to get started on GameHub" : "Check your email for the verification code"}
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
            <Label htmlFor="username">Username</Label>
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

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
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
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
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
            Send Verification Code
          </Button>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="space-y-4">
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
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              type="text"
              placeholder="Enter the 8-character code"
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
              Back
            </Button>
            <Button type="submit" className="w-2/3" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
          </div>
        </form>
      )}

      <div className="text-center text-sm text-muted-foreground mt-4">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}
