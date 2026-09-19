"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("erp_user");
    if (!storedUser) {
      router.push("/");
      return;
    }

    // Reading localStorage on mount to seed client-only state is the
    // valid case for this pattern; eslint's new rule flags it regardless.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUser(JSON.parse(storedUser));
  }, [router]);

  function logout() {
    localStorage.removeItem("erp_access_token");
    localStorage.removeItem("erp_user");
    router.push("/");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-xl shadow-slate-950/50">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-sky-400">Dashboard</p>
            <h1 className="mt-2 text-3xl font-bold">Bienvenido</h1>
          </div>
          <button
            onClick={logout}
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700"
          >
            Cerrar sesión
          </button>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <p className="text-sm text-slate-400">Usuario</p>
            <p className="mt-3 text-xl font-semibold">{user?.name ?? "Cargando..."}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <p className="text-sm text-slate-400">Email</p>
            <p className="mt-3 text-xl font-semibold">{user?.email ?? "-"}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <p className="text-sm text-slate-400">Rol</p>
            <p className="mt-3 text-xl font-semibold">{user?.role ?? "-"}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
