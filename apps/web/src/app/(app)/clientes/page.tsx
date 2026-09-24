"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { ClientForm } from "@/components/forms/ClientForm";
import { ApiError } from "@/lib/api";
import { Client, ClientInput, ClientStage, createClient, deleteClient, listClients, updateClient } from "@/lib/clients";

const STAGE_FILTERS: { value: ClientStage | "ALL"; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "LEAD", label: "Interesado" },
  { value: "PROSPECT", label: "Prospecto" },
  { value: "CUSTOMER", label: "Cliente" },
  { value: "INACTIVE", label: "Inactivo" },
];

export default function ClientesPage() {
  const confirm = useConfirm();
  const toast = useToast();
  const [clients, setClients] = useState<Client[] | null>(null);
  const [stageFilter, setStageFilter] = useState<ClientStage | "ALL">("ALL");
  const [error, setError] = useState("");
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  async function loadClients() {
    setError("");
    try {
      const data = await listClients(stageFilter === "ALL" ? undefined : stageFilter);
      setClients(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudieron cargar los clientes");
    }
  }

  useEffect(() => {
    loadClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageFilter]);

  function openCreate() {
    setEditingClient(null);
    setModalMode("create");
  }

  function openEdit(client: Client) {
    setEditingClient(client);
    setModalMode("edit");
  }

  function closeModal() {
    setModalMode(null);
    setEditingClient(null);
  }

  async function handleSubmit(input: ClientInput) {
    if (modalMode === "edit" && editingClient) {
      await updateClient(editingClient.id, input);
      toast.success("Cliente actualizado");
    } else {
      await createClient(input);
      toast.success("Cliente creado");
    }
    closeModal();
    await loadClients();
  }

  async function handleDelete(client: Client) {
    if (!(await confirm(`¿Eliminar a "${client.name}"? Esto no borra su historial, solo lo desactiva.`, { confirmLabel: "Eliminar" }))) return;
    try {
      await deleteClient(client.id);
      toast.success("Cliente eliminado");
      await loadClients();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo eliminar el cliente";
      setError(message);
      toast.error(message);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-teal-600 dark:text-teal-400">CRM</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">Clientes</h1>
        </div>
        <button
          onClick={openCreate}
          className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400"
        >
          + Nuevo cliente
        </button>
      </div>

      <div className="mt-6 flex gap-2">
        {STAGE_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setStageFilter(filter.value)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
              stageFilter === filter.value
                ? "border-teal-600 bg-teal-50 text-teal-700 dark:border-teal-500 dark:bg-teal-500/10 dark:text-teal-300"
                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-600"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
            <tr>
              <th className="px-5 py-3 font-medium">Nombre</th>
              <th className="px-5 py-3 font-medium">Contacto</th>
              <th className="px-5 py-3 font-medium">Etapa</th>
              <th className="px-5 py-3 font-medium">Origen</th>
              <th className="px-5 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {clients === null ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate-500 dark:text-slate-400">
                  Cargando...
                </td>
              </tr>
            ) : clients.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate-500 dark:text-slate-400">
                  No hay clientes con este filtro todavía.
                </td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                  <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-slate-100">{client.name}</td>
                  <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300">
                    <div>{client.email ?? "—"}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{client.phone ?? ""}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge value={client.stage} />
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{client.source ?? "—"}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(client)}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(client)}
                        className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-500/10"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalMode ? (
        <Modal title={modalMode === "edit" ? "Editar cliente" : "Nuevo cliente"} onClose={closeModal}>
          <ClientForm client={editingClient ?? undefined} onSubmit={handleSubmit} onCancel={closeModal} />
        </Modal>
      ) : null}
    </div>
  );
}
