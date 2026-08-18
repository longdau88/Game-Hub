"use client";

import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Search, MoreHorizontal, UserX, UserCheck, Shield, ShieldAlert, Mail, Pencil, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { fetchAPI } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

export default function UserManagementPage() {
  const [mounted, setMounted] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'user' });
  const [saving, setSaving] = useState(false);
  const [emailComposer, setEmailComposer] = useState<{ isOpen: boolean; user: any; subject: string; body: string; sending: boolean }>({ isOpen: false, user: null, subject: '', body: '', sending: false });
  const { t } = useLanguage();

  useEffect(() => {
    setMounted(true);
    fetchAPI('/admin/users')
      .then(res => setUsers(res.data || []))
      .catch(err => {
        console.error("Failed to fetch users", err);
        setUsers([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await fetchAPI(`/admin/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole })
      });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole === 'admin' ? 'ADMIN' : 'user' } : u));
    } catch (err) {
      console.error("Failed to update user role", err);
    }
  };

  const handleBanToggle = async (userId: number, isBanned: boolean) => {
    try {
      await fetchAPI(`/admin/users/${userId}/ban`, {
        method: 'PUT',
        body: JSON.stringify({ isBanned })
      });
      setUsers(users.map(u => u.id === userId ? { ...u, isBanned } : u));
    } catch (err) {
      console.error("Failed to toggle ban status", err);
    }
  };

  const openCreateModal = () => {
    setCurrentUser(null);
    setFormData({ username: '', email: '', password: '', role: 'user' });
    setIsModalOpen(true);
  };

  const openEditModal = (user: any) => {
    setCurrentUser(user);
    setFormData({ username: user.username || '', email: user.email || '', password: '', role: user.role === 'ADMIN' ? 'ADMIN' : 'user' });
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (currentUser) {
        const res = await fetchAPI(`/admin/users/${currentUser.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
        setUsers(users.map(u => u.id === currentUser.id ? { ...u, ...res.user } : u));
      } else {
        const res = await fetchAPI('/admin/users', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        setUsers([res.user, ...users]);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to save user", err);
      alert(t("game.loadError") || "Failed to save user");
    } finally {
      setSaving(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailComposer.subject || !emailComposer.body) {
      alert("Please enter subject and message.");
      return;
    }
    
    setEmailComposer({ ...emailComposer, sending: true });
    try {
      await fetchAPI(`/admin/users/${emailComposer.user.id}/email`, {
        method: 'POST',
        body: JSON.stringify({ subject: emailComposer.subject, body: emailComposer.body })
      });
      alert(t("admin.emailSentSuccess") || "Email sent successfully!");
      setEmailComposer({ isOpen: false, user: null, subject: '', body: '', sending: false });
    } catch (err) {
      console.error("Failed to send email", err);
      alert(t("game.loadError") || "Failed to send email");
      setEmailComposer({ ...emailComposer, sending: false });
    }
  };

  if (!mounted) return null;

  const filteredUsers = users.filter(user => 
    (user.username?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (user.email?.toLowerCase() || '').includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("admin.userManagement") || "User Management"}</h1>
          <p className="text-muted-foreground mt-1">{t("admin.userManagementDesc") || "View and manage platform users, roles, and statuses."}</p>
        </div>
        <Button onClick={openCreateModal} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md">
          {t("admin.inviteUser") || "Invite User"}
        </Button>
      </div>

      <Card className="border-border bg-surface/30">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>{t("admin.allUsers") || "All Users"}</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t("admin.searchUsersPlaceholder") || "Search users..."}
                className="pl-8 bg-background border-border"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="p-12 text-center text-muted-foreground">{t("loading") || "Loading..."}</div>
          ) : filteredUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.colUser") || "User"}</TableHead>
                  <TableHead>{t("admin.colRole") || "Role"}</TableHead>
                  <TableHead>{t("admin.colStatus") || "Status"}</TableHead>
                  <TableHead>{t("admin.colJoined") || "Joined"}</TableHead>
                  <TableHead className="text-right">{t("admin.colActions") || "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar size="sm" src={user.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} fallback={user.username?.charAt(0) || "U"} />
                        <div>
                          <div className="text-foreground">{user.username}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'ADMIN' ? 'default' : user.role === 'CREATOR' ? 'secondary' : 'outline'}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isBanned ? 'destructive' : 'success'} className={user.isBanned ? 'bg-error/10 text-error border-error/20' : ''}>
                        {user.isBanned ? (t("admin.banned") || 'Suspended') : (t("admin.active") || 'Active')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title={t("admin.editUser") || "Edit User"}
                          onClick={() => openEditModal(user)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title={t("admin.sendEmail") || "Send Email"}
                          onClick={() => setEmailComposer({ isOpen: true, user: user, subject: '', body: '', sending: false })}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title={(user.role === 'ADMIN' || user.role === 'admin') ? (t("admin.makeUser") || "Demote to User") : (t("admin.makeAdmin") || "Promote to Admin")}
                          onClick={() => handleRoleChange(user.id, (user.role === 'ADMIN' || user.role === 'admin') ? 'user' : 'admin')}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                          {(user.role === 'ADMIN' || user.role === 'admin') ? <ShieldAlert className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                        </Button>
                        {user.role !== 'ADMIN' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title={user.isBanned ? (t("admin.unban") || "Unban") : (t("admin.ban") || "Ban")}
                            onClick={() => handleBanToggle(user.id, !user.isBanned)}
                            className={`h-8 w-8 ${user.isBanned ? 'text-success hover:text-success hover:bg-success/10' : 'text-error hover:text-error hover:bg-error/10'}`}
                          >
                            {user.isBanned ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-12 text-center border border-dashed border-border rounded-xl">
               <p className="text-muted-foreground font-semibold">{t("not_available") || "Chưa có dữ liệu"}</p>
               <p className="text-sm text-muted-foreground/70">{t("admin.noUsers") || "No users found."}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface border border-border rounded-xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-bold">{currentUser ? (t("admin.editUser") || "Edit User") : (t("admin.inviteUser") || "Invite User")}</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("admin.username") || "Username"}</label>
                <Input required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="bg-background" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("admin.email") || "Email"}</label>
                <Input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="bg-background" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("admin.password") || "Password"}</label>
                <Input 
                  type="password" 
                  required={!currentUser} 
                  placeholder={currentUser ? (t("admin.passwordPlaceholderEdit") || "Leave blank to keep unchanged") : (t("admin.passwordPlaceholderCreate") || "Enter password...")}
                  value={formData.password} 
                  onChange={e => setFormData({...formData, password: e.target.value})} 
                  className="bg-background" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("admin.role") || "Role"}</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                >
                  <option value="user">{t("admin.roleUser") || "Standard User"}</option>
                  <option value="ADMIN">{t("admin.roleAdmin") || "Administrator"}</option>
                </select>
              </div>
              <div className="pt-4 flex items-center justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                  {t("admin.cancel") || "Cancel"}
                </Button>
                <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  {saving ? (t("loading") || "Loading...") : (t("admin.save") || "Save")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Email Composer Popup (Gmail style) */}
      {emailComposer.isOpen && (
        <div className="fixed bottom-0 right-10 z-50 w-[400px] bg-surface border border-border rounded-t-xl shadow-2xl flex flex-col overflow-hidden">
          <div className="bg-primary px-4 py-3 flex items-center justify-between text-primary-foreground">
            <span className="font-semibold text-sm">{t("admin.composeEmail") || "New Message"}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-primary-foreground hover:bg-primary/80" onClick={() => setEmailComposer({...emailComposer, isOpen: false})}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="p-4 flex flex-col gap-3">
            <div className="text-sm text-muted-foreground border-b border-border pb-2 flex items-center gap-2">
              <span className="font-medium text-foreground">To:</span> {emailComposer.user?.email}
            </div>
            <Input 
              placeholder={t("admin.emailSubject") || "Subject"} 
              value={emailComposer.subject} 
              onChange={e => setEmailComposer({...emailComposer, subject: e.target.value})} 
              className="border-0 px-0 rounded-none border-b border-border shadow-none focus-visible:ring-0 bg-transparent text-sm" 
            />
            <textarea 
              placeholder={t("admin.emailBody") || "Write your message..."} 
              value={emailComposer.body} 
              onChange={e => setEmailComposer({...emailComposer, body: e.target.value})} 
              className="w-full min-h-[200px] resize-none bg-transparent border-0 px-0 py-2 focus:outline-none text-sm" 
            />
          </div>
          <div className="p-3 border-t border-border flex items-center justify-between bg-surface/50">
            <Button onClick={handleSendEmail} disabled={emailComposer.sending} className="bg-primary hover:bg-primary/90 text-primary-foreground px-6">
              {emailComposer.sending ? (t("admin.sending") || "Sending...") : (t("admin.send") || "Send")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
