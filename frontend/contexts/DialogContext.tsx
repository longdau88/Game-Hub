"use client";

import { createContext, ReactNode, useContext, useState } from "react";
import { CheckCircle2, AlertCircle, Info, TriangleAlert } from "lucide-react";
import { useLanguage } from "./LanguageContext";

type DialogVariant = "success" | "error" | "info" | "warning";
type DialogOptions = { title?: string; message: string; variant?: DialogVariant; confirmLabel?: string };
type DialogState = DialogOptions & { type: "alert" | "confirm"; resolve: (value: boolean) => void };
type DialogContextValue = { confirm: (options: DialogOptions) => Promise<boolean>; notify: (options: DialogOptions) => Promise<void> };
const DialogContext = createContext<DialogContextValue | undefined>(undefined);

export function DialogProvider({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const close = (result: boolean) => { if (!dialog) return; dialog.resolve(result); setDialog(null); };
  const confirm = (options: DialogOptions) => new Promise<boolean>(resolve => setDialog({ ...options, type: "confirm", resolve }));
  const notify = (options: DialogOptions) => new Promise<void>(resolve => setDialog({ ...options, type: "alert", resolve: () => resolve() }));
  const variant = dialog?.variant || "info";
  const Icon = variant === "success" ? CheckCircle2 : variant === "error" ? AlertCircle : variant === "warning" ? TriangleAlert : Info;
  const iconClass = variant === "success" ? "text-emerald-500" : variant === "error" ? "text-red-500" : variant === "warning" ? "text-amber-500" : "text-primary";

  return <DialogContext.Provider value={{ confirm, notify }}>
    {children}
    {dialog && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4" role="presentation" onMouseDown={() => close(false)}>
      <div role="dialog" aria-modal="true" aria-labelledby="app-dialog-title" className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl" onMouseDown={event => event.stopPropagation()}>
        <div className="flex gap-3"><Icon className={`mt-0.5 h-6 w-6 shrink-0 ${iconClass}`} /><div><h2 id="app-dialog-title" className="font-semibold">{dialog.title || (dialog.type === "confirm" ? t("dialog.confirmTitle") : t("dialog.noticeTitle"))}</h2><p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{dialog.message}</p></div></div>
        <div className="mt-6 flex justify-end gap-3">
          {dialog.type === "confirm" && <button type="button" onClick={() => close(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted">{t("dialog.cancel")}</button>}
          <button type="button" autoFocus onClick={() => close(true)} className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${variant === "error" || variant === "warning" ? "bg-red-600 hover:bg-red-700" : "bg-primary hover:bg-primary/90"}`}>{dialog.confirmLabel || t("dialog.confirm")}</button>
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
