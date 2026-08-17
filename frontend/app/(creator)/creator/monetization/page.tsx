"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, CreditCard, ArrowUpRight, ArrowDownRight, Clock, Building2 } from "lucide-react";

const TRANSACTIONS = [
  { id: "TX-9921", date: "Oct 24, 2023", desc: "Ad Revenue (Oct)", amount: "+$1,240.50", status: "Completed" },
  { id: "TX-9920", date: "Oct 15, 2023", desc: "In-App Purchases (Neon District)", amount: "+$350.00", status: "Completed" },
  { id: "TX-9919", date: "Oct 01, 2023", desc: "Payout to Bank Account", amount: "-$2,100.00", status: "Completed" },
  { id: "TX-9918", date: "Sep 24, 2023", desc: "Ad Revenue (Sep)", amount: "+$980.20", status: "Completed" },
];

export default function MonetizationPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="space-y-8 pb-10">
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Monetization</h1>
        <p className="text-muted-foreground mt-1">Manage your earnings, revenue splits, and payouts.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Balance Card */}
        <Card className="lg:col-span-2 bg-gradient-to-br from-indigo-900 to-purple-900 text-white border-0 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <CardContent className="p-8 relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <Wallet className="w-6 h-6 text-indigo-300" />
                <span className="font-semibold text-indigo-200">Available Balance</span>
              </div>
              <Badge className="bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-md">
                Next Payout: Nov 1st
              </Badge>
            </div>
            
            <div>
              <h2 className="text-5xl md:text-7xl font-black drop-shadow-md">$4,250.75</h2>
              <div className="flex items-center gap-4 mt-4 text-sm text-indigo-200">
                <span className="flex items-center"><ArrowUpRight className="w-4 h-4 mr-1 text-emerald-400" /> +$1,590 this month</span>
              </div>
            </div>
            
            <div className="flex gap-4 mt-8">
              <Button className="bg-white text-indigo-900 hover:bg-indigo-50 font-bold px-8">
                Request Payout
              </Button>
              <Button variant="outline" className="text-white border-white/20 hover:bg-white/10 hover:text-white">
                View Analytics
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payout Method */}
        <Card className="border-border bg-surface/50">
          <CardHeader>
            <CardTitle>Payout Method</CardTitle>
            <CardDescription>Where we send your earnings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 rounded-xl border border-border bg-background flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-8 bg-zinc-800 rounded relative overflow-hidden flex items-center justify-center shrink-0">
                  <div className="w-6 h-6 bg-red-500 rounded-full absolute -left-2" />
                  <div className="w-6 h-6 bg-amber-500 rounded-full absolute -right-2 mix-blend-screen" />
                </div>
                <div>
                  <p className="font-semibold text-sm">•••• •••• •••• 4242</p>
                  <p className="text-xs text-muted-foreground">Expires 12/28</p>
                </div>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
            
            <div className="p-4 rounded-xl border border-border bg-background flex items-center justify-between opacity-60">
              <div className="flex items-center gap-3">
                <div className="w-12 h-10 bg-secondary rounded flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Bank Account</p>
                  <p className="text-xs text-muted-foreground">Ending in 9901</p>
                </div>
              </div>
            </div>

            <Button variant="outline" className="w-full border-dashed">
              <CreditCard className="w-4 h-4 mr-2" /> Add New Method
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Split Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border bg-surface/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Platform Split</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <h3 className="text-4xl font-black text-indigo-500">85%</h3>
              <span className="text-muted-foreground mb-1 font-medium">Creator</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">You keep 85% of all ad revenue and in-app purchases generated by your games.</p>
          </CardContent>
        </Card>
        
        <Card className="border-border bg-surface/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Ad Impressions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <h3 className="text-4xl font-black">1.2M</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Total ad impressions across your portfolio this month.</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-surface/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">eCPM</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <h3 className="text-4xl font-black text-emerald-500">$2.45</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Effective cost per mille (thousand impressions) average.</p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card className="border-border bg-surface/50">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your earning history and payouts.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-semibold">Transaction ID</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Description</th>
                  <th className="px-6 py-4 font-semibold">Amount</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {TRANSACTIONS.map((tx) => (
                  <tr key={tx.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{tx.id}</td>
                    <td className="px-6 py-4 text-muted-foreground flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" /> {tx.date}
                    </td>
                    <td className="px-6 py-4 text-foreground">{tx.desc}</td>
                    <td className={`px-6 py-4 font-bold ${tx.amount.startsWith('+') ? 'text-success' : 'text-foreground'}`}>
                      {tx.amount}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                        {tx.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
    </div>
  );
}
