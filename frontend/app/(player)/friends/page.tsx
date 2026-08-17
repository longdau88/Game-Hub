"use client";

import { useState, useEffect } from "react";
import { Users, Search, UserPlus, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";

const MOCK_FRIENDS = [
  { id: "1", name: "Alex Chen", handle: "@alexc", status: "Online", playing: "Neon District: Zero", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" },
  { id: "2", name: "Sarah Connor", handle: "@sarahc", status: "Offline", playing: null, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" },
  { id: "3", name: "Mike Ross", handle: "@miker", status: "In Game", playing: "Cyber Racer 3D", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike" },
];

export default function FriendsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="flex flex-col space-y-10 pb-10 max-w-4xl mx-auto">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Friends</h1>
          <p className="text-muted-foreground mt-1">Connect with players and see what they're playing.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="w-full pl-9 bg-surface border-border" placeholder="Find friends..." />
          </div>
          <Button className="shrink-0"><UserPlus className="w-4 h-4 md:mr-2" /><span className="hidden md:inline">Add Friend</span></Button>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        {MOCK_FRIENDS.map((friend, idx) => (
          <div key={friend.id} className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-secondary/50 ${idx !== MOCK_FRIENDS.length - 1 ? 'border-b border-border' : ''}`}>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar size="lg" src={friend.avatar} fallback={friend.name.charAt(0)} />
                <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-surface ${
                  friend.status === 'Online' ? 'bg-success' : 
                  friend.status === 'In Game' ? 'bg-primary' : 'bg-muted-foreground'
                }`} />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight">{friend.name}</h3>
                <p className="text-sm text-muted-foreground">{friend.handle}</p>
                {friend.playing && (
                  <p className="text-xs font-medium text-primary mt-1">Playing: {friend.playing}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm"><MessageSquare className="w-4 h-4 mr-2" /> Message</Button>
              <Button variant="ghost" size="sm">Profile</Button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
