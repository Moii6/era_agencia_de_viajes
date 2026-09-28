"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  Notification,
} from "@/lib/notifications";

const POLL_INTERVAL_MS = 30_000;

function relativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
}

export function NotificationsBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      setNotifications(await listNotifications());
    } catch {
      // Silent — a failed poll shouldn't surface an error banner; it'll
      // just retry on the next interval.
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function handleSelect(notification: Notification) {
    setOpen(false);
    if (!notification.read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)),
      );
      markNotificationRead(notification.id).catch(() => {});
    }
    if (notification.link) {
      router.push(notification.link);
    }
  }

  async function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await markAllNotificationsRead();
    } catch {
      load();
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notificaciones"
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4.5 w-4.5">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4.5 min-w-[1.125rem] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute left-0 top-11 z-20 w-80 rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/30">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notificaciones</p>
            {unreadCount > 0 ? (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-medium text-teal-700 hover:underline dark:text-teal-400"
              >
                Marcar todas como leídas
              </button>
            ) : null}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                Sin notificaciones
              </p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleSelect(n)}
                  className={`block w-full border-b border-slate-50 px-4 py-3 text-left text-sm last:border-b-0 hover:bg-slate-50 dark:border-slate-800/60 dark:hover:bg-slate-800/60 ${
                    n.read ? "text-slate-500 dark:text-slate-400" : "text-slate-900 dark:text-slate-100"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.read ? <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-600 dark:bg-teal-400" /> : null}
                    <div className={n.read ? "" : "flex-1"}>
                      <p>{n.message}</p>
                      <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{relativeTime(n.createdAt)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
