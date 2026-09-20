"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearSession, getUser, SessionUser } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/clientes", label: "Clientes" },
  { href: "/proveedores", label: "Proveedores" },
  { href: "/viajes", label: "Viajes" },
  { href: "/cotizaciones", label: "Cotizaciones" },
  { href: "/reservas", label: "Reservas" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  // Must start as null (matching the server, which has no localStorage) and
  // only be set inside an effect — reading it synchronously during render
  // would make the client's first paint diverge from the SSR HTML and
  // trigger a hydration mismatch.
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    const stored = getUser();
    if (!stored) {
      router.push("/");
      return;
    }
    setUser(stored);
  }, [router]);

  function logout() {
    clearSession();
    router.push("/");
  }

  if (!user) {
    return <div className="min-h-screen bg-slate-50 dark:bg-slate-950" />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-8">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-teal-600 dark:text-teal-400">ERP</p>
          <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">Travify</p>
        </div>

        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-teal-600 text-white dark:bg-teal-500"
                    : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-800">
          <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{user.name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{user.role}</p>
          <button
            onClick={logout}
            className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
