"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { ProviderForm } from "@/components/forms/ProviderForm";
import { ApiError } from "@/lib/api";
import {
  Provider,
  ProviderInput,
  ProviderType,
  createProvider,
  deleteProvider,
  listProviders,
  updateProvider,
} from "@/lib/providers";

const TYPE_FILTERS: { value: ProviderType | "ALL"; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "HOTEL", label: "Hotel" },
  { value: "TRANSPORT", label: "Transportista" },
  { value: "OTHER", label: "Otro" },
];

export default function ProveedoresPage() {
  const confirm = useConfirm();
  const toast = useToast();
  const [providers, setProviders] = useState<Provider[] | null>(null);
  const [typeFilter, setTypeFilter] = useState<ProviderType | "ALL">("ALL");
  const [error, setError] = useState("");
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);

  async function loadProviders() {
    setError("");
    try {
      const data = await listProviders(typeFilter === "ALL" ? undefined : typeFilter);
      setProviders(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudieron cargar los proveedores");
    }
  }

  useEffect(() => {
    loadProviders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter]);

  function openCreate() {
    setEditingProvider(null);
    setModalMode("create");
  }

  function openEdit(provider: Provider) {
    setEditingProvider(provider);
    setModalMode("edit");
  }

  function closeModal() {
    setModalMode(null);
    setEditingProvider(null);
  }

  async function handleSubmit(input: ProviderInput) {
    if (modalMode === "edit" && editingProvider) {
      await updateProvider(editingProvider.id, input);
      toast.success("Proveedor actualizado");
    } else {
      await createProvider(input);
      toast.success("Proveedor creado");
    }
    closeModal();
    await loadProviders();
  }

  async function handleDelete(provider: Provider) {
    if (!(await confirm(`¿Eliminar a "${provider.name}"? Esto no borra su historial, solo lo desactiva.`, { confirmLabel: "Eliminar" }))) return;
    try {
      await deleteProvider(provider.id);
      toast.success("Proveedor eliminado");
      await loadProviders();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo eliminar el proveedor";
      setError(message);
      toast.error(message);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-teal-600 dark:text-teal-400">Catálogo</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">Proveedores</h1>
        </div>
        <button
          onClick={openCreate}
          className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400"
        >
          + Nuevo proveedor
        </button>
      </div>

      <div className="mt-6 flex gap-2">
        {TYPE_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setTypeFilter(filter.value)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
              typeFilter === filter.value
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
              <th className="px-5 py-3 font-medium">Tipo</th>
              <th className="px-5 py-3 font-medium">Contacto</th>
              <th className="px-5 py-3 font-medium">Notas</th>
              <th className="px-5 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {providers === null ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate-500 dark:text-slate-400">
                  Cargando...
                </td>
              </tr>
            ) : providers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate-500 dark:text-slate-400">
                  No hay proveedores con este filtro todavía.
                </td>
              </tr>
            ) : (
              providers.map((provider) => (
                <tr key={provider.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-slate-900 dark:text-slate-100">{provider.name}</div>
                    {provider.address ? <div className="text-xs text-slate-500 dark:text-slate-400">{provider.address}</div> : null}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge value={provider.type} />
                  </td>
                  <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300">
                    {provider.contacts.length > 0 ? (
                      <div className="space-y-0.5">
                        {provider.contacts.map((contact, index) => (
                          <div key={index}>{contact}</div>
                        ))}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{provider.notes ?? "—"}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(provider)}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(provider)}
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
        <Modal title={modalMode === "edit" ? "Editar proveedor" : "Nuevo proveedor"} onClose={closeModal}>
          <ProviderForm provider={editingProvider ?? undefined} onSubmit={handleSubmit} onCancel={closeModal} />
        </Modal>
      ) : null}
    </div>
  );
}
