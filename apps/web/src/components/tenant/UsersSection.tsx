"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { UserForm } from "@/components/forms/UserForm";
import { ApiError } from "@/lib/api";
import { formatDate } from "@/lib/formats";
import {
  AgencyUser,
  approveUser,
  createUser,
  deactivateUser,
  listUsers,
  reactivateUser,
  rejectUser,
  updateUser,
  UserInput,
  UserUpdateInput,
} from "@/lib/users";

const ROLE_LABELS: Record<string, string> = { OWNER: "Propietario", ADMIN: "Administrador", AGENT: "Agente", GUIDE: "Guía" };

function describePendingChange(user: AgencyUser) {
  if (user.status === "PENDING") return null;

  const changes = [
    user.pendingName && user.pendingName !== user.name ? `nombre → ${user.pendingName}` : null,
    user.pendingEmail && user.pendingEmail !== user.email ? `email → ${user.pendingEmail}` : null,
    user.pendingRole && user.pendingRole !== user.role ? `rol → ${ROLE_LABELS[user.pendingRole]}` : null,
  ].filter(Boolean);

  return changes.length > 0 ? changes.join(", ") : null;
}

// Consensus needs every active OWNER except the requester (if the requester
// is one) — mirrors UsersService.requiredApproverIds so the UI can show
// progress without a dedicated endpoint for it.
function approvalProgress(users: AgencyUser[], target: AgencyUser) {
  const activeOwnerIds = users.filter((u) => u.role === "OWNER" && u.status === "ACTIVE").map((u) => u.id);
  const requiredIds = activeOwnerIds.filter((id) => id !== target.requestedByUserId);
  const approvedCount = target.approvedByUserIds.filter((id) => requiredIds.includes(id)).length;
  return { requiredCount: requiredIds.length, approvedCount };
}

type UsersSectionProps = {
  currentUserId: string;
  currentUserRole: string;
};

export function UsersSection({ currentUserId, currentUserRole }: UsersSectionProps) {
  const [users, setUsers] = useState<AgencyUser[] | null>(null);
  const [error, setError] = useState("");
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingUser, setEditingUser] = useState<AgencyUser | null>(null);

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

  async function handleSubmit(input: UserInput | UserUpdateInput) {
    if (modalMode === "edit" && editingUser) {
      await updateUser(editingUser.id, input as UserUpdateInput);
    } else {
      await createUser(input as UserInput);
    }
    setModalMode(null);
    setEditingUser(null);
    await load();
  }

  async function handleApprove(user: AgencyUser) {
    try {
      await approveUser(user.id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo aprobar");
    }
  }

  async function handleReject(user: AgencyUser) {
    const what = user.status === "PENDING" ? "el alta" : "el cambio propuesto";
    if (!confirm(`¿Rechazar ${what} de "${user.name}"?`)) return;
    try {
      await rejectUser(user.id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo rechazar");
    }
  }

  async function handleDeactivate(user: AgencyUser) {
    if (!confirm(`¿Desactivar a "${user.name}"? Perderá acceso de inmediato.`)) return;
    try {
      await deactivateUser(user.id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo desactivar");
    }
  }

  async function handleReactivate(user: AgencyUser) {
    try {
      await reactivateUser(user.id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo reactivar");
    }
  }

  function closeModal() {
    setModalMode(null);
    setEditingUser(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Usuarios</h3>
        <button
          onClick={() => {
            setEditingUser(null);
            setModalMode("create");
          }}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          + Agregar
        </button>
      </div>

      {error ? <p className="mt-2 text-sm text-rose-700 dark:text-rose-400">{error}</p> : null}

      <div className="mt-3 space-y-2">
        {users === null ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Cargando...</p>
        ) : users.filter((u) => u.id !== currentUserId).length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Sin otros usuarios todavía.</p>
        ) : (
          users
            .filter((agencyUser) => agencyUser.id !== currentUserId)
            .map((agencyUser) => {
            const isPendingCreation = agencyUser.status === "PENDING";
            const pendingChangeSummary = describePendingChange(agencyUser);
            const hasSomethingPending = isPendingCreation || pendingChangeSummary !== null;
            const isRequester = agencyUser.requestedByUserId === currentUserId;
            const alreadyApproved = agencyUser.approvedByUserIds.includes(currentUserId);
            const canApprove = currentUserRole === "OWNER" && !isRequester && hasSomethingPending && !alreadyApproved;
            const canReject = currentUserRole === "OWNER" && !isRequester && hasSomethingPending;
            const { requiredCount, approvedCount } = approvalProgress(users, agencyUser);
            const canToggleStatus =
              currentUserRole === "OWNER" && (agencyUser.status === "ACTIVE" || agencyUser.status === "INACTIVE");

            return (
              <div
                key={agencyUser.id}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/60"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{agencyUser.name}</p>
                      <Badge value={agencyUser.role} />
                      <Badge value={agencyUser.status} />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {agencyUser.email}
                      {agencyUser.lastLoginAt
                        ? ` · Último acceso: ${formatDate(agencyUser.lastLoginAt)}`
                        : " · Sin accesos todavía"}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {!isPendingCreation ? (
                      <button
                        onClick={() => {
                          setEditingUser(agencyUser);
                          setModalMode("edit");
                        }}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        Editar
                      </button>
                    ) : null}
                    {canToggleStatus && agencyUser.status === "ACTIVE" ? (
                      <button
                        onClick={() => handleDeactivate(agencyUser)}
                        className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:bg-slate-800 dark:text-rose-300 dark:hover:bg-rose-500/10"
                      >
                        Desactivar
                      </button>
                    ) : null}
                    {canToggleStatus && agencyUser.status === "INACTIVE" ? (
                      <button
                        onClick={() => handleReactivate(agencyUser)}
                        className="rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:bg-slate-800 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
                      >
                        Reactivar
                      </button>
                    ) : null}
                  </div>
                </div>

                {hasSomethingPending ? (
                  <div className="mt-2 border-t border-slate-200 pt-2 dark:border-slate-700">
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      {isPendingCreation
                        ? `Alta pendiente de aprobación · solicitada por ${agencyUser.requestedBy?.name ?? "—"}`
                        : `Cambio pendiente de aprobación (solicitado por ${agencyUser.requestedBy?.name ?? "—"}): ${pendingChangeSummary}`}
                      {requiredCount > 0 ? ` · ${approvedCount} de ${requiredCount} aprobaciones` : null}
                    </p>
                    {canApprove ? (
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => handleApprove(agencyUser)}
                          className="rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:bg-slate-800 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={() => handleReject(agencyUser)}
                          className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:bg-slate-800 dark:text-rose-300 dark:hover:bg-rose-500/10"
                        >
                          Rechazar
                        </button>
                      </div>
                    ) : canReject ? (
                      <div className="mt-2 flex items-center gap-2">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Ya diste tu aprobación — falta la de otro OWNER.</p>
                        <button
                          onClick={() => handleReject(agencyUser)}
                          className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:bg-slate-800 dark:text-rose-300 dark:hover:bg-rose-500/10"
                        >
                          Rechazar
                        </button>
                      </div>
                    ) : (
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {isRequester ? "Esperando aprobación de los demás OWNER." : "Solo un OWNER distinto al solicitante puede revisar esto."}
                      </p>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      {modalMode ? (
        <Modal title={modalMode === "edit" ? "Editar usuario" : "Registrar usuario"} onClose={closeModal}>
          <UserForm
            user={editingUser ?? undefined}
            canEditRole={currentUserRole === "OWNER"}
            onSubmit={handleSubmit}
            onCancel={closeModal}
          />
        </Modal>
      ) : null}
    </div>
  );
}
