"use client";

import { createContext, ReactNode, useContext, useState } from "react";
import { CheckCircle2, AlertCircle, Info, TriangleAlert } from "lucide-react";
import { useLanguage } from "./LanguageContext";

type DialogVariant = "success" | "error" | "info" | "warning";
type DialogOptions = { title?: string; message: string; variant?: DialogVariant; confirmLabel?: string; placeholder?: string };
type DialogState = DialogOptions & { type: "alert" | "confirm" | "prompt"; resolve: (value: any) => void };
type DialogContextValue = { 
  confirm: (options: DialogOptions) => Promise<boolean>; 
  notify: (options: DialogOptions) => Promise<void>;
  prompt: (options: DialogOptions) => Promise<string | null>;
};
const DialogContext = createContext<DialogContextValue | undefined>(undefined);

export function DialogProvider({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [inputValue, setInputValue] = useState("");

  const close = (result: any) => { 
    if (!dialog) return; 
    dialog.resolve(result); 
    setDialog(null); 
    setInputValue("");
  };
  
  const confirm = (options: DialogOptions) => new Promise<boolean>(resolve => setDialog({ ...options, type: "confirm", resolve }));
  const notify = (options: DialogOptions) => new Promise<void>(resolve => setDialog({ ...options, type: "alert", resolve: () => resolve() }));
  const prompt = (options: DialogOptions) => new Promise<string | null>(resolve => setDialog({ ...options, type: "prompt", resolve }));
  
  const variant = dialog?.variant || "info";
  const Icon = variant === "success" ? CheckCircle2 : variant === "error" ? AlertCircle : variant === "warning" ? TriangleAlert : Info;
  const iconClass = variant === "success" ? "text-emerald-500" : variant === "error" ? "text-red-500" : variant === "warning" ? "text-amber-500" : "text-primary";

  return <DialogContext.Provider value={{ confirm, notify, prompt }}>
    {children}
    {dialog && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="presentation" onMouseDown={() => close(dialog.type === 'prompt' ? null : false)}>
      <div role="dialog" aria-modal="true" aria-labelledby="app-dialog-title" className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50" onMouseDown={event => event.stopPropagation()}>
        <div className="flex gap-3"><Icon className={`mt-0.5 h-6 w-6 shrink-0 ${iconClass}`} /><div className="min-w-0"><h2 id="app-dialog-title" className="font-semibold">{dialog.title || (dialog.type === "confirm" ? t("dialog.confirmTitle") : t("dialog.noticeTitle"))}</h2><p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{dialog.message}</p></div></div>
        
        {dialog.type === "prompt" && (
          <div className="mt-4 pl-9">
            <textarea
              autoFocus
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder={dialog.placeholder || "Enter here..."}
              className="w-full min-h-[80px] rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary dark:border-zinc-700"
            />
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          {(dialog.type === "confirm" || dialog.type === "prompt") && <button type="button" onClick={() => close(dialog.type === 'prompt' ? null : false)} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">{t("dialog.cancel")}</button>}
          <button type="button" autoFocus={dialog.type !== "prompt"} onClick={() => close(dialog.type === 'prompt' ? inputValue : true)} className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${variant === "error" || variant === "warning" ? "bg-red-600 hover:bg-red-700" : "bg-primary hover:bg-primary/90"}`}>{dialog.confirmLabel || t("dialog.confirm")}</button>
        </div>
      </div>
    </div>}
  </DialogContext.Provider>;
}

export function useAppDialog() {
  const context = useContext(DialogContext);
  if (!context) throw new Error("useAppDialog must be used within DialogProvider");
  return context;
}
