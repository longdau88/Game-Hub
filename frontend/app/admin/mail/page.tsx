"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { Trash2 } from "lucide-react";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function AdminMailPage() {
  const { t } = useLanguage();
  const [mailTemplates, setMailTemplates] = useState<any[]>([]);
  const [mailCampaigns, setMailCampaigns] = useState<any[]>([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [mailForm, setMailForm] = useState({ target: "all", subject: "", content: "" });
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const token = Cookies.get("token");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [r1, r2] = await Promise.all([
        fetch(`${apiUrl}/api/admin/mail/templates`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiUrl}/api/admin/mail/campaigns`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (r1.ok) { const d = await r1.json(); if (d.success) setMailTemplates(d.data); }
      if (r2.ok) { const d = await r2.json(); if (d.success) setMailCampaigns(d.data); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const sendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm("Send this email campaign to all selected recipients?")) return;
    setSending(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/mail/campaigns`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(mailForm),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Campaign sent! Sent count: ${data.sentCount}`);
        setMailForm({ target: "all", subject: "", content: "" });
        fetchData();
      } else {
        alert(data.error || "Failed to send campaign.");
      }
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  };

  const deleteCampaigns = async (all: boolean, ids: number[] = []) => {
    if (!confirm("Are you sure you want to delete the selected campaigns?")) return;
    try {
      const res = await fetch(`${apiUrl}/api/admin/mail/campaigns`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ all, ids }),
      });
      if (res.ok) { setSelectedCampaigns([]); fetchData(); }
      else alert("Failed to delete campaigns.");
    } catch (error) { console.error(error); }
  };

  const toggleCampaignSelect = (id: number) => {
    setSelectedCampaigns((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  if (loading) return <div className="flex flex-col items-center justify-center py-20 text-zinc-500 dark:text-zinc-400"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div><p className="font-medium">{t("common.loading") || "Đang tải..."}</p></div>;

  return (
    <div className="space-y-8">
      <h3 className="text-lg font-semibold">{t("admin.mailTitle")}</h3>

      {/* Create Campaign */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h4 className="font-semibold mb-4">{t("admin.mailCreate")}</h4>
        <form onSubmit={sendCampaign} className="space-y-4">
          <div>
            <label className="block text-sm mb-1 text-zinc-500">{t("admin.mailRecipients")}</label>
            <select
              value={mailForm.target}
              onChange={(e) => setMailForm({ ...mailForm, target: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:border-primary"
            >
              <option value="all">{t("admin.mailAllUsers")}</option>
              <option value="active">{t("admin.mailActiveUsers")}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1 text-zinc-500">{t("admin.mailSubject")}</label>
            <input
              required
              value={mailForm.subject}
              onChange={(e) => setMailForm({ ...mailForm, subject: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:border-primary"
              placeholder="Email subject..."
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-zinc-500">{t("admin.mailContent")}</label>
            <textarea
              required
              value={mailForm.content}
              onChange={(e) => setMailForm({ ...mailForm, content: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:border-primary min-h-[120px]"
              placeholder="<p>Your HTML content here...</p>"
            />
          </div>
          <button
            type="submit"
            disabled={sending}
            className="px-6 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-zinc-900 dark:text-white rounded-lg font-medium transition-colors"
          >
            {sending ? "Sending..." : t("admin.mailSend")}
          </button>
        </form>
      </div>

      {/* Campaign History */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
          <h4 className="font-semibold">{t("admin.mailHistory")}</h4>
          <div className="flex gap-2">
            {selectedCampaigns.length > 0 && (
              <button
                onClick={() => deleteCampaigns(false, selectedCampaigns)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> {t("admin.btnDeleteSelected")} ({selectedCampaigns.length})
              </button>
            )}
            {mailCampaigns.length > 0 && (
              <button
                onClick={() => deleteCampaigns(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-lg text-xs font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> {t("admin.btnDeleteAll")}
              </button>
            )}
          </div>
        </div>
        <ul className="divide-y divide-border">
          {mailCampaigns.map((campaign) => (
            <li key={campaign.id} className="p-4 flex items-center gap-4">
              <input
                type="checkbox"
                checked={selectedCampaigns.includes(campaign.id)}
                onChange={() => toggleCampaignSelect(campaign.id)}
                className="w-4 h-4 accent-primary shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{campaign.subject}</p>
                <p className="text-xs text-zinc-500">{campaign.targetGroup || campaign.target} â€¢ {new Date(campaign.createdAt).toLocaleString()}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-medium">{campaign.sentCount ?? 0}</p>
                <p className="text-xs text-zinc-500">{t("admin.mailSentHeader")}</p>
              </div>
            </li>
          ))}
          {mailCampaigns.length === 0 && (
            <li className="p-8 text-center text-zinc-500">{t("admin.mailNoHistory")}</li>
          )}
        </ul>
      </div>
    </div>
  );
}

