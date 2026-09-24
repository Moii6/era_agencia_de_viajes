"use client";

import { createContext, useCallback, useContext, useState } from "react";

type ConfirmOptions = {
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  // Most existing confirm() calls in this app guard a destructive action
  // (eliminar/desactivar/rechazar), so danger styling is the sensible default.
  tone?: "danger" | "neutral";
};

type PendingConfirm = ConfirmOptions & {
  message: string;
  resolve: (value: boolean) => void;
};

type ConfirmFn = (message: string, options?: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirm = useCallback<ConfirmFn>((message, options) => {
    return new Promise<boolean>((resolve) => {
      setPending({ message, resolve, ...options });
    });
  }, []);

  function settle(value: boolean) {
    pending?.resolve(value);
    setPending(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending ? (
        <div className="fixed inset-0 z-[110] overflow-y-auto bg-black/60 dark:bg-black/70">
          <div className="flex min-h-full items-center justify-center px-4 py-8">
            <button aria-label="Cancelar" onClick={() => settle(false)} className="fixed inset-0 cursor-default" />
            <div className="relative z-10 w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/40">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {pending.title ?? "Confirmar"}
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{pending.message}</p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => settle(false)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  {pending.cancelLabel ?? "Cancelar"}
                </button>
                <button
                  onClick={() => settle(true)}
                  autoFocus
                  className={
                    pending.tone === "neutral"
                      ? "rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400"
                      : "rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-400"
                  }
                >
                  {pending.confirmLabel ?? "Confirmar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm debe usarse dentro de <ConfirmProvider>");
  }
  return ctx;
}
