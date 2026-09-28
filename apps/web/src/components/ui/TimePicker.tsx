"use client";

import { useEffect, useRef, useState } from "react";

const OPTIONS = Array.from({ length: 24 * 4 }, (_, i) => {
  const hours = String(Math.floor(i / 4)).padStart(2, "0");
  const minutes = String((i % 4) * 15).padStart(2, "0");
  return `${hours}:${minutes}`;
});

type TimePickerProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
};

export function TimePicker({ id, value, onChange, required }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && listRef.current) {
      const target = listRef.current.querySelector('[data-selected="true"]') as HTMLElement | null;
      target?.scrollIntoView({ block: "center" });
    }
  }, [open]);

  function select(option: string) {
    onChange(option);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-left text-sm text-slate-900 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-teal-500"
      >
        <span className={value ? "" : "text-slate-400 dark:text-slate-500"}>{value || "Selecciona hora"}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-4 w-4 shrink-0 text-slate-400">
          <circle cx="12" cy="12" r="9" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" />
        </svg>
      </button>
      {/* Hidden input keeps native "required" browser validation working
          without a native time input actually being rendered. */}
      <input type="text" value={value} required={required} readOnly tabIndex={-1} aria-hidden className="sr-only" id={id} />

      {open ? (
        <div
          ref={listRef}
          className="absolute z-20 mt-1 max-h-56 w-32 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/30"
        >
          {OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              data-selected={option === value}
              onClick={() => select(option)}
              className={`block w-full rounded-lg px-3 py-1.5 text-left text-sm ${
                option === value
                  ? "bg-teal-600 font-semibold text-white dark:bg-teal-500"
                  : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
