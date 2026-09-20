"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { TenantForm } from "@/components/forms/TenantForm";
import { UsersSection } from "@/components/tenant/UsersSection";
import { ApiError } from "@/lib/api";
import { getUser, SessionUser } from "@/lib/auth";
import { getTenant, Tenant, TenantInput, updateTenant } from "@/lib/tenant";

export default function AgenciaPage() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [error, setError] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);

  async function load() {
    setError("");
    try {
      setTenant(await getTenant());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cargar la agencia");
    }
  }

  useEffect(() => {
    setUser(getUser());
    load();
  }, []);

  async function handleEdit(input: TenantInput) {
    await updateTenant(input);
    setShowEditModal(false);
    await load();
  }

  const canEdit = user?.role === "OWNER" || user?.role === "ADMIN";

  if (error && !tenant) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-500/10 dark:text-rose-300">
        {error}
      </div>
    );
  }

  if (!tenant) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Cargando...</p>;
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-teal-600 dark:text-teal-400">Configuración</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">{tenant.name}</h1>
        </div>
        {canEdit ? (
          <button
            onClick={() => setShowEditModal(true)}
            className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400"
          >
            Editar
          </button>
        ) : null}
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
            Representante
          </p>
          <p className="mt-2 text-sm text-slate-900 dark:text-slate-100">
            {tenant.representativeName ?? "Sin registrar"}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
            Dirección
          </p>
          <p className="mt-2 text-sm text-slate-900 dark:text-slate-100">{tenant.address ?? "Sin registrar"}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
            Contacto
          </p>
          {tenant.contacts.length > 0 ? (
            <div className="mt-2 space-y-0.5">
              {tenant.contacts.map((contact, index) => (
                <p key={index} className="text-sm text-slate-900 dark:text-slate-100">
                  {contact}
                </p>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-900 dark:text-slate-100">Sin registrar</p>
          )}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
            Actividad
          </p>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">Usuarios: {tenant.stats.users}</p>
          <p className="text-sm text-slate-700 dark:text-slate-300">Clientes: {tenant.stats.clients}</p>
          <p className="text-sm text-slate-700 dark:text-slate-300">Viajes: {tenant.stats.trips}</p>
        </div>
      </div>

      {tenant.notes ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
            Notas
          </p>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{tenant.notes}</p>
        </div>
      ) : null}

      {canEdit && user ? (
        <div className="mt-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <UsersSection currentUserId={user.id} currentUserRole={user.role} />
          </div>
        </div>
      ) : null}

      {showEditModal ? (
        <Modal title="Editar agencia" onClose={() => setShowEditModal(false)}>
          <TenantForm tenant={tenant} onSubmit={handleEdit} onCancel={() => setShowEditModal(false)} />
        </Modal>
      ) : null}
    </div>
  );
}
