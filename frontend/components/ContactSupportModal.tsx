import React, { useState } from 'react';
import { X, Send, Mail, Heading } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppDialog } from '@/contexts/DialogContext';
import { fetchAPI } from '@/lib/api';

interface ContactSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
}

export function ContactSupportModal({ isOpen, onClose, defaultEmail = '' }: ContactSupportModalProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isVi } = useLanguage();
  const { notify } = useAppDialog();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !subject || !message) {
      notify({ 
        message: isVi ? "Vui lòng nhập đầy đủ thông tin." : "Please fill in all fields.", 
        variant: "warning" 
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await fetchAPI('/support', {
        method: 'POST',
        body: JSON.stringify({ email, subject, message })
      });
      
      notify({ 
        message: isVi ? "Đã gửi yêu cầu hỗ trợ thành công!" : "Support request sent successfully!", 
        variant: "success" 
      });
      
      setEmail(defaultEmail);
      setSubject('');
      setMessage('');
      onClose();
    } catch (error) {
      console.error(error);
      notify({ 
        message: isVi ? "Có lỗi xảy ra khi gửi yêu cầu." : "Failed to send request.", 
        variant: "error" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              {isVi ? "Liên hệ Hỗ trợ" : "Contact Support"}
            </h2>
            <p className="text-sm text-zinc-500 mt-1">
              {isVi ? "Gửi tin nhắn trực tiếp đến đội ngũ Game Hub" : "Send a direct message to the Game Hub team"}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              {isVi ? "Email của bạn" : "Your Email"}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              {isVi ? "Chủ đề" : "Subject"}
            </label>
            <div className="relative">
              <Heading className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input 
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={isVi ? "Ví dụ: Lỗi đăng nhập, Hỏi về bản quyền..." : "e.g., Login issue, Copyright question..."}
                className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              {isVi ? "Nội dung" : "Message"}
            </label>
            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={isVi ? "Mô tả chi tiết vấn đề của bạn..." : "Describe your issue in detail..."}
              className="w-full p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none min-h-[120px] resize-y"
              required
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              {isVi ? "Hủy" : "Cancel"}
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {isVi ? "Gửi yêu cầu" : "Send Message"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
