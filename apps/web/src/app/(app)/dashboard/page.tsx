"use client";

import { useEffect, useState } from "react";
import { getUser, SessionUser } from "@/lib/auth";

export default function DashboardPage() {
  // Same reasoning as the layout: start null (matches SSR), read the real
  // value only inside an effect to avoid a hydration mismatch.
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  return (
    <div>
      <p className="text-sm uppercase tracking-[0.2em] text-teal-600">Dashboard</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">Bienvenido</h1>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Usuario</p>
          <p className="mt-3 text-xl font-semibold text-slate-900">{user?.name ?? "-"}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Email</p>
          <p className="mt-3 text-xl font-semibold text-slate-900">{user?.email ?? "-"}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Rol</p>
          <p className="mt-3 text-xl font-semibold text-slate-900">{user?.role ?? "-"}</p>
        </div>
      </div>
    </div>
  );
}
