"use client";

import { useEffect, useState } from "react";
import { MyProfileCard } from "@/components/tenant/MyProfileCard";
import { getUser, SessionUser } from "@/lib/auth";

export default function PerfilPage() {
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  if (!user) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Cargando...</p>;
  }

  return (
    <div>
      <p className="text-sm uppercase tracking-[0.2em] text-teal-600 dark:text-teal-400">Cuenta</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">Mi perfil</h1>

      <div className="mt-6 max-w-xl">
        <MyProfileCard currentUserRole={user.role} />
      </div>
    </div>
  );
}
