"use client";

import { useState, useEffect } from "react";
import { fetchAPI } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppDialog } from "@/contexts/DialogContext";
import { Mail, Trash2, Send, X, Clock, CheckCircle2 } from "lucide-react";

export default function SupportInboxPage() {
  const [mounted, setMounted] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyBody, setReplyBody] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const { locale } = useLanguage();
  const isVi = locale === "vi";
  const { notify, confirm } = useAppDialog();

  const fetchTickets = () => {
    setLoading(true);
    fetchAPI('/admin/support')
      .then(res => setTickets(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setMounted(true);
    fetchTickets();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    const confirmed = await confirm({
      title: isVi ? "Xóa tin nhắn?" : "Delete message?",
      message: isVi ? "Bạn có chắc muốn xóa tin nhắn hỗ trợ này không?" : "Are you sure you want to delete this support message?"
    });
    
    if (confirmed) {
      try {
        await fetchAPI(`/admin/support/${id}`, { method: 'DELETE' });
        notify({ message: isVi ? "Đã xóa tin nhắn" : "Message deleted", variant: "success" });
        if (selectedTicket?.id === id) setSelectedTicket(null);
        fetchTickets();
      } catch (err) {
        console.error(err);
        notify({ message: isVi ? "Lỗi khi xóa" : "Failed to delete", variant: "error" });
      }
    }
  };

  const handleReply = async () => {
    if (!replyBody.trim()) {
      notify({ message: isVi ? "Vui lòng nhập nội dung" : "Please enter a reply", variant: "warning" });
      return;
    }
    
    setIsReplying(true);
    try {
      await fetchAPI(`/admin/support/${selectedTicket.id}/reply`, {
        method: 'POST',
        body: JSON.stringify({
          subject: `Re: ${selectedTicket.subject}`,
          body: replyBody
        })
      });
      notify({ message: isVi ? "Đã gửi phản hồi" : "Reply sent successfully", variant: "success" });
      setReplyBody("");
      setSelectedTicket({ ...selectedTicket, status: 'REPLIED' });
      fetchTickets();
    } catch (err) {
      console.error(err);
      notify({ message: isVi ? "Có lỗi xảy ra khi gửi" : "Failed to send reply", variant: "error" });
    } finally {
      setIsReplying(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 h-screen flex flex-col overflow-hidden">
      <div className="flex-shrink-0">
        <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-3">
          <Mail className="w-8 h-8 text-primary" />
          {isVi ? "Hộp thư hỗ trợ" : "Support Inbox"}
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          {isVi ? "Quản lý các tin nhắn từ người dùng." : "Manage support messages from users."}
        </p>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden min-h-[500px]">
        {/* Left List */}
        <div className={`flex-1 md:w-1/3 md:flex-none flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm ${selectedTicket ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
            <h2 className="font-semibold text-zinc-700 dark:text-zinc-300">
              {isVi ? "Tin nhắn" : "Messages"} ({tickets.length})
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl animate-pulse" />
              ))
            ) : tickets.length === 0 ? (
              <div className="text-center p-8 text-zinc-500">{isVi ? "Chưa có tin nhắn nào." : "No messages found."}</div>
            ) : (
              tickets.map(ticket => (
                <div 
                  key={ticket.id} 
                  onClick={() => setSelectedTicket(ticket)}
                  className={`p-4 rounded-xl cursor-pointer transition-all border ${selectedTicket?.id === ticket.id ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20' : 'bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800'}`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <h3 className={`font-semibold truncate max-w-[80%] ${ticket.status === 'OPEN' ? 'text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-400'}`}>
                      {ticket.subject}
                    </h3>
                    {ticket.status === 'OPEN' ? (
                      <span className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-1" />
                    )}
                  </div>
                  <p className="text-sm text-zinc-500 truncate mb-3">{ticket.email}</p>
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(ticket.createdAt).toLocaleDateString()}</span>
                    <button onClick={(e) => handleDelete(e, ticket.id)} className="p-1.5 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 rounded-md transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Detail Pane */}
        <div className={`flex-[2] flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm ${!selectedTicket ? 'hidden md:flex' : 'flex'}`}>
          {selectedTicket ? (
            <>
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between bg-zinc-50 dark:bg-zinc-900/50 relative">
                <button onClick={() => setSelectedTicket(null)} className="md:hidden absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-700 bg-white shadow-sm rounded-full">
                  <X className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 pr-10">{selectedTicket.subject}</h2>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                      {selectedTicket.email[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{selectedTicket.email}</p>
                      <p className="text-xs text-zinc-500">{new Date(selectedTicket.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-zinc-900">
                <div className="prose dark:prose-invert max-w-none text-zinc-700 dark:text-zinc-300 text-sm whitespace-pre-wrap">
                  {selectedTicket.message}
                </div>
              </div>
              <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    {isVi ? "Phản hồi qua Email" : "Reply via Email"}
                  </h4>
                  {selectedTicket.status === 'REPLIED' && (
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {isVi ? "Đã phản hồi" : "Replied"}
                    </span>
                  )}
                </div>
                <textarea 
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder={isVi ? "Nhập nội dung phản hồi..." : "Type your reply here..."}
                  className="w-full p-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none min-h-[120px] text-sm resize-y mb-3"
                />
                <div className="flex justify-end">
                  <button 
                    onClick={handleReply}
                    disabled={isReplying || !replyBody.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {isReplying ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                    {isVi ? "Gửi phản hồi" : "Send Reply"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 p-8 text-center">
              <Mail className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium text-zinc-600 dark:text-zinc-300">{isVi ? "Chọn một tin nhắn" : "Select a message"}</p>
              <p className="text-sm mt-1">{isVi ? "để xem chi tiết và phản hồi." : "to view details and reply."}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
