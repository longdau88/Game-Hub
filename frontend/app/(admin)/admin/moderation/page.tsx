"use client";

import { useState, useEffect } from "react";
import { fetchAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, CheckCircle, Clock } from "lucide-react";
import { useAppDialog } from "@/components/ui/dialogs";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ModerationPage() {
  const { t } = useLanguage();
  const { notify, confirm } = useAppDialog();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'open' | 'resolved'>('open');
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await fetchAPI('/reports/admin');
      if (Array.isArray(data)) {
        setReports(data);
      } else if (data && Array.isArray(data.data)) {
        setReports(data.data);
      } else {
        setReports([]);
      }
    } catch (error) {
      console.error(error);
      notify({ message: t("admin.noReportsFound") || "Failed to load reports.", variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (!mounted) return null;

  const handleResolve = async (id: number) => {
    const isConfirmed = await confirm({
      title: t("admin.resolveReport") || "Resolve Report",
      description: t("admin.resolveConfirm") || "Are you sure you want to mark this report as resolved?",
      confirmText: t("admin.resolveReport") || "Resolve",
      cancelText: t("admin.cancel") || "Cancel",
      variant: "default"
    });
    
    if (!isConfirmed) return;

    try {
      await fetchAPI(`/reports/admin/${id}/resolve`, { method: 'PUT' });
      notify({ message: t("admin.resolved") || "Report resolved.", variant: "success" });
      fetchReports();
    } catch (error) {
      console.error(error);
      notify({ message: t("game.loadError") || "Failed to resolve report.", variant: "error" });
    }
  };

  const filteredReports = reports.filter(r => {
    if (activeTab !== r.status) return false;
    if (!search) return true;
    const lowerSearch = search.toLowerCase();
    return (
      r.reason?.toLowerCase().includes(lowerSearch) ||
      r.user?.username?.toLowerCase().includes(lowerSearch) ||
      r.game?.title?.toLowerCase().includes(lowerSearch)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("admin.moderation") || "Moderation"}</h1>
        <p className="text-muted-foreground">{t("admin.moderationDesc") || "Manage and resolve violation reports."}</p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface p-4 rounded-xl border border-border">
        <div className="flex bg-background rounded-lg p-1 border border-border">
          <Button 
            variant={activeTab === 'open' ? 'secondary' : 'ghost'} 
            size="sm"
            onClick={() => setActiveTab('open')}
            className={`rounded-md ${activeTab === 'open' ? 'bg-secondary text-foreground shadow-sm' : 'text-muted-foreground'}`}
          >
            <Clock className="w-4 h-4 mr-2" />
            {t("admin.openReports") || "Open"}
          </Button>
          <Button 
            variant={activeTab === 'resolved' ? 'secondary' : 'ghost'} 
            size="sm"
            onClick={() => setActiveTab('resolved')}
            className={`rounded-md ${activeTab === 'resolved' ? 'bg-secondary text-foreground shadow-sm' : 'text-muted-foreground'}`}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            {t("admin.resolvedReports") || "Resolved"}
          </Button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder={t("admin.searchPlaceholder") || "Search..."}
            className="pl-9 bg-background border-border"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary/30 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">{t("admin.colGame") || "Game"}</th>
                <th className="px-6 py-4 font-medium">{t("admin.colReporter") || "Reporter"}</th>
                <th className="px-6 py-4 font-medium">{t("admin.colReportReason") || "Report Reason"}</th>
                <th className="px-6 py-4 font-medium">{t("admin.colDate") || "Date"}</th>
                <th className="px-6 py-4 font-medium text-right">{t("admin.colActions") || "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    {t("admin.noReportsFound") || "No reports found."}
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {report.game?.coverImageUrl ? (
                          <img src={report.game.coverImageUrl} alt="" className="w-10 h-10 rounded-lg object-cover bg-background" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center">
                            <span className="text-muted-foreground text-xs">No img</span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-foreground">{report.game?.title || 'Unknown Game'}</p>
                          <p className="text-xs text-muted-foreground">{report.gameId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-foreground">{report.user?.username || 'Unknown User'}</p>
                      <p className="text-xs text-muted-foreground">{report.user?.email}</p>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="text-foreground truncate" title={report.reason}>{report.reason}</p>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {report.status === 'open' && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
                          onClick={() => handleResolve(report.id)}
                          title={t("admin.resolveReport") || "Resolve Report"}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
