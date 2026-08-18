"use client";

import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Search, MoreHorizontal, UserX, Shield, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { fetchAPI } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

export default function UserManagementPage() {
  const [mounted, setMounted] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
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
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md">
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
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                          <Shield className="h-4 w-4" />
                        </Button>
                        {user.role !== 'ADMIN' && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-error hover:text-error hover:bg-error/10">
                            <UserX className="h-4 w-4" />
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
    </div>
  );
}
