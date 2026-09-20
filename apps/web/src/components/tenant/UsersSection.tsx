"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { UserForm } from "@/components/forms/UserForm";
import { ApiError } from "@/lib/api";
import { formatDate } from "@/lib/formats";
import { AgencyUser, createUser, listUsers, UserInput } from "@/lib/users";

export function UsersSection() {
  const [users, setUsers] = useState<AgencyUser[] | null>(null);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  async function load() {
    try {
      setUsers(await listUsers());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudieron cargar los usuarios");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(input: UserInput) {
    await createUser(input);
    setShowCreateModal(false);
    await load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Usuarios</h3>
        <button
          onClick={() => setShowCreateModal(true)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          + Agregar
        </button>
      </div>

      {error ? <p className="mt-2 text-sm text-rose-700 dark:text-rose-400">{error}</p> : null}

      <div className="mt-3 space-y-2">
        {users === null ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Cargando...</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Sin usuarios todavía.</p>
        ) : (
          users.map((agencyUser) => (
            <div
              key={agencyUser.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/60"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{agencyUser.name}</p>
                  <Badge value={agencyUser.role} />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {agencyUser.email}
                  {agencyUser.lastLoginAt
                    ? ` · Último acceso: ${formatDate(agencyUser.lastLoginAt)}`
                    : " · Sin accesos todavía"}
                </p>
              </div>
              <Badge value={agencyUser.status} />
            </div>
          ))
        )}
      </div>

      {showCreateModal ? (
        <Modal title="Registrar usuario" onClose={() => setShowCreateModal(false)}>
          <UserForm onSubmit={handleSubmit} onCancel={() => setShowCreateModal(false)} />
        </Modal>
      ) : null}
    </div>
  );
}
