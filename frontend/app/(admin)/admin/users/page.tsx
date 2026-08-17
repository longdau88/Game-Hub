"use client";

import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Search, MoreHorizontal, UserX, Shield, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MOCK_USERS = [
  { id: "USR-001", name: "John Doe", email: "john@example.com", role: "Player", status: "Active", joinedAt: "Oct 24, 2023" },
  { id: "USR-002", name: "Jane Smith", email: "jane@example.com", role: "Creator", status: "Active", joinedAt: "Sep 12, 2023" },
  { id: "USR-003", name: "NeonStudios", email: "contact@neonstudios.com", role: "Creator", status: "Active", joinedAt: "Jan 05, 2023" },
  { id: "USR-004", name: "TrollMaster99", email: "troll@example.com", role: "Player", status: "Suspended", joinedAt: "Nov 01, 2023" },
  { id: "USR-005", name: "Sarah Connor", email: "sarah@example.com", role: "Admin", status: "Active", joinedAt: "Dec 15, 2022" },
];

export default function UserManagementPage() {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-1">View and manage platform users, roles, and statuses.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md">
          Invite User
        </Button>
      </div>

      <Card className="border-border bg-surface/30">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>All Users</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search users..."
                className="pl-8 bg-background border-border"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_USERS.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar size="sm" fallback={user.name.charAt(0)} />
                      <div>
                        <div className="text-foreground">{user.name}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'Admin' ? 'default' : user.role === 'Creator' ? 'secondary' : 'outline'}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status === 'Active' ? 'success' : 'destructive'} className={user.status === 'Suspended' ? 'bg-error/10 text-error border-error/20' : ''}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.joinedAt}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Shield className="h-4 w-4" />
                      </Button>
                      {user.status !== 'Admin' && (
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
        </CardContent>
      </Card>
    </div>
  );
}
