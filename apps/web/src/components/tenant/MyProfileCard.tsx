"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { UserForm } from "@/components/forms/UserForm";
import { ApiError } from "@/lib/api";
import { formatDate } from "@/lib/formats";
import { AgencyUser, approveUser, getMe, rejectUser, updateUser, UserInput, UserUpdateInput } from "@/lib/users";

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

type MyProfileCardProps = {
  currentUserRole: string;
};

export function MyProfileCard({ currentUserRole }: MyProfileCardProps) {
  const confirm = useConfirm();
  const toast = useToast();
  const [me, setMe] = useState<AgencyUser | null>(null);
  const [error, setError] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);

  async function load() {
    try {
      setMe(await getMe());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cargar tu perfil");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleEdit(input: UserInput | UserUpdateInput) {
    if (!me) return;
    const result = await updateUser(me.id, input as UserUpdateInput);
    toast.success(result.requestedByUserId ? "Cambio guardado, pendiente de aprobación" : "Perfil actualizado");
    setShowEditModal(false);
    await load();
  }

  async function handleApprove() {
    if (!me) return;
    try {
      await approveUser(me.id);
      toast.success("Aprobación registrada");
      await load();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo aprobar";
      setError(message);
      toast.error(message);
    }
  }

  async function handleReject() {
    if (!me) return;
    if (!(await confirm("¿Rechazar el cambio propuesto a tu cuenta?", { confirmLabel: "Rechazar" }))) return;
    try {
      await rejectUser(me.id);
      toast.success("Solicitud rechazada");
      await load();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo rechazar";
      setError(message);
      toast.error(message);
    }
  }

  if (!me) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
          Mi perfil
        </p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {error || "Cargando..."}
        </p>
      </div>
    );
  }

  const pendingChangeSummary = describePendingChange(me);
  const hasSomethingPending = pendingChangeSummary !== null;
  const isRequester = me.requestedByUserId === me.id;
  const canReview = currentUserRole === "OWNER" && !isRequester && hasSomethingPending;
  // Mirrors the backend: PATCH /users/:id is OWNER/ADMIN only, so that's the
  // only audience that can propose a change to their own profile here.
  const canEditSelf = currentUserRole === "OWNER" || currentUserRole === "ADMIN";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
          Mi perfil
        </p>
        {canEditSelf ? (
          <button
            onClick={() => setShowEditModal(true)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Editar
          </button>
        ) : null}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{me.name}</p>
        <Badge value={me.role} />
        <Badge value={me.status} />
      </div>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {me.email}
        {me.lastLoginAt ? ` · Último acceso: ${formatDate(me.lastLoginAt)}` : " · Sin accesos previos registrados"}
      </p>

      {error ? <p className="mt-2 text-xs text-rose-700 dark:text-rose-400">{error}</p> : null}

      {hasSomethingPending ? (
        <div className="mt-2 border-t border-slate-200 pt-2 dark:border-slate-700">
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Cambio pendiente de aprobación (solicitado por {me.requestedBy?.name ?? "—"}): {pendingChangeSummary}
          </p>
          {canReview ? (
            <div className="mt-2 flex gap-2">
              <button
                onClick={handleApprove}
                className="rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:bg-slate-800 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
              >
                Aprobar
              </button>
              <button
                onClick={handleReject}
                className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:bg-slate-800 dark:text-rose-300 dark:hover:bg-rose-500/10"
              >
                Rechazar
              </button>
            </div>
          ) : (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Esperando aprobación de otro OWNER.
            </p>
          )}
        </div>
      ) : null}

      {showEditModal ? (
        <Modal title="Editar mi perfil" onClose={() => setShowEditModal(false)}>
          <UserForm
            user={me}
            canEditRole={currentUserRole === "OWNER"}
            onSubmit={handleEdit}
            onCancel={() => setShowEditModal(false)}
          />
        </Modal>
      ) : null}
    </div>
  );
}
