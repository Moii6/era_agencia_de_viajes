"use client";

import { useEffect, useRef, useState } from "react";

const WEEKDAY_LABELS = ["D", "L", "M", "M", "J", "V", "S"];
const MONTH_LABELS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

// Same UTC-calendar-date convention used everywhere else in the app
// (see lib/formats.ts) — a Trip's departureDate/returnDate carry no
// meaningful time-of-day, so all the month/day math here stays in UTC to
// avoid the viewer's timezone shifting a date across a day boundary.
function parseISODate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatDisplay(value: string): string {
  const date = parseISODate(value);
  if (!date) return "";
  return `${String(date.getUTCDate()).padStart(2, "0")}/${String(date.getUTCMonth() + 1).padStart(2, "0")}/${date.getUTCFullYear()}`;
}

function buildMonthGrid(viewDate: Date): Date[] {
  const year = viewDate.getUTCFullYear();
  const month = viewDate.getUTCMonth();
  const firstOfMonth = new Date(Date.UTC(year, month, 1));
  const startOffset = firstOfMonth.getUTCDay();
  const gridStart = new Date(Date.UTC(year, month, 1 - startOffset));

  return Array.from({ length: 42 }, (_, i) => new Date(Date.UTC(
    gridStart.getUTCFullYear(),
    gridStart.getUTCMonth(),
    gridStart.getUTCDate() + i,
  )));
}

type DatePickerProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
};

export function DatePicker({ id, value, onChange, required }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = parseISODate(value);
  const [viewDate, setViewDate] = useState(() => selected ?? new Date(Date.UTC(
    new Date().getUTCFullYear(), new Date().getUTCMonth(), 1,
  )));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selected) {
      setViewDate(new Date(Date.UTC(selected.getUTCFullYear(), selected.getUTCMonth(), 1)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const today = new Date();
  const todayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const days = buildMonthGrid(viewDate);
  const viewMonth = viewDate.getUTCMonth();

  function selectDay(day: Date) {
    onChange(toISODate(day));
    setOpen(false);
  }

  function shiftMonth(delta: number) {
    setViewDate((prev) => new Date(Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth() + delta, 1)));
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-left text-sm text-slate-900 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-teal-500"
      >
        <span className={value ? "" : "text-slate-400 dark:text-slate-500"}>
          {value ? formatDisplay(value) : "Selecciona fecha"}
        </span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-4 w-4 shrink-0 text-slate-400">
          <rect x="3" y="4.5" width="18" height="16" rx="2" />
          <path strokeLinecap="round" d="M8 2.5v4M16 2.5v4M3 9.5h18" />
        </svg>
      </button>
      {/* Hidden input keeps native "required" browser validation working
          (a fill-in-the-blank tooltip on submit) without a native date
          input actually being rendered. */}
      <input type="text" value={value} required={required} readOnly tabIndex={-1} aria-hidden className="sr-only" id={id} />

      {open ? (
        <div className="absolute z-20 mt-1 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-lg shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/30">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              aria-label="Mes anterior"
            >
              ‹
            </button>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {MONTH_LABELS[viewMonth]} {viewDate.getUTCFullYear()}
            </p>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              aria-label="Mes siguiente"
            >
              ›
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-slate-400 dark:text-slate-500">
            {WEEKDAY_LABELS.map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {days.map((day, i) => {
              const dayUTC = Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate());
              const inMonth = day.getUTCMonth() === viewMonth;
              const isSelected = selected && dayUTC === Date.UTC(selected.getUTCFullYear(), selected.getUTCMonth(), selected.getUTCDate());
              const isToday = dayUTC === todayUTC;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectDay(day)}
                  className={`rounded-lg py-1.5 text-xs ${
                    isSelected
                      ? "bg-teal-600 font-semibold text-white dark:bg-teal-500"
                      : isToday
                        ? "border border-teal-400 text-slate-900 dark:border-teal-600 dark:text-slate-100"
                        : inMonth
                          ? "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                          : "text-slate-300 hover:bg-slate-50 dark:text-slate-600 dark:hover:bg-slate-800/50"
                  }`}
                >
                  {day.getUTCDate()}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
