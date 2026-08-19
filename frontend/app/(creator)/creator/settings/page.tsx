"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppDialog } from "@/contexts/DialogContext";
import { fetchAPI } from "@/lib/api";
import { Loader2, Save, User, Shield } from "lucide-react";

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const { t } = useLanguage();
  const { notify } = useAppDialog();
  
  // Profile State
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileForm, setProfileForm] = useState({
    username: "",
    bio: "",
    avatarUrl: "",
    email: "" // Read-only
  });

  // Password State
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  useEffect(() => {
    setMounted(true);
    // Fetch initial profile
    fetchAPI('/users/me')
      .then((res: any) => {
        setProfileForm({
          username: res.username || "",
          bio: res.bio || "",
          avatarUrl: res.avatarUrl || "",
          email: res.email || ""
        });
      })
      .catch(console.error);
  }, []);

  if (!mounted) return null;

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      await fetchAPI('/users/me', {
        method: 'PUT',
        body: JSON.stringify({
          username: profileForm.username,
          bio: profileForm.bio,
          avatarUrl: profileForm.avatarUrl
        })
      });
      notify(t("creator.profileUpdated") || "Profile updated successfully", "success");
    } catch (err: any) {
      notify(err.message || "Failed to update profile", "error");
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      notify(t("creator.passwordMismatch") || "Passwords do not match", "error");
      return;
    }

    setPasswordLoading(true);
    try {
      await fetchAPI('/users/me/password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });
      notify(t("creator.passwordUpdated") || "Password changed successfully", "success");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      notify(err.message || "Failed to change password", "error");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-10 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("nav.settings") || "Settings"}</h1>
          <p className="text-muted-foreground mt-1">{t("creator.settingsDesc") || "Manage your creator profile and preferences."}</p>
        </div>
      </div>

      <div className="grid gap-8">
        {/* Profile Settings */}
        <Card className="bg-surface/50 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              {t("creator.profileSettings") || "Creator Profile"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label>{t("creator.email") || "Email"}</Label>
                <Input value={profileForm.email} disabled className="bg-muted" />
              </div>
              
              <div className="space-y-2">
                <Label>{t("creator.username") || "Display Name"}</Label>
                <Input 
                  value={profileForm.username} 
                  onChange={(e: any) => setProfileForm({...profileForm, username: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>{t("creator.avatarUrl") || "Avatar URL"}</Label>
                <Input 
                  value={profileForm.avatarUrl} 
                  onChange={(e: any) => setProfileForm({...profileForm, avatarUrl: e.target.value})}
                  placeholder="https://example.com/avatar.png"
                />
              </div>

              <div className="space-y-2">
                <Label>{t("creator.bio") || "Bio"}</Label>
                <Textarea 
                  value={profileForm.bio} 
                  onChange={(e: any) => setProfileForm({...profileForm, bio: e.target.value})}
                  className="resize-none h-24"
                  placeholder="Tell your players about yourself..."
                />
              </div>

              <div className="pt-4">
                <Button type="submit" disabled={profileLoading}>
                  {profileLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  {t("creator.saveChanges") || "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="bg-surface/50 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-error" />
              {t("creator.security") || "Security"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label>{t("creator.currentPassword") || "Current Password"}</Label>
                <Input 
                  type="password"
                  value={passwordForm.currentPassword} 
                  onChange={(e: any) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>{t("creator.newPassword") || "New Password"}</Label>
                <Input 
                  type="password"
                  value={passwordForm.newPassword} 
                  onChange={(e: any) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>{t("creator.confirmPassword") || "Confirm New Password"}</Label>
                <Input 
                  type="password"
                  value={passwordForm.confirmPassword} 
                  onChange={(e: any) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  required
                />
              </div>

              <div className="pt-4">
                <Button type="submit" variant="destructive" disabled={passwordLoading}>
                  {passwordLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Shield className="w-4 h-4 mr-2" />}
                  {t("creator.changePassword") || "Change Password"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
