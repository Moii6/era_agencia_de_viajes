"use client";

type ModalProps = {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: "md" | "lg";
};

const SIZE_CLASSES = {
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export function Modal({ title, onClose, children, size = "md" }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 dark:bg-black/70">
      <div className="flex min-h-full items-center justify-center px-4 py-8">
        <button aria-label="Cerrar" onClick={onClose} className="fixed inset-0 cursor-default" />
        <div
          className={`relative z-10 w-full ${SIZE_CLASSES[size]} rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/40`}
        >
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            >
              ✕
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
