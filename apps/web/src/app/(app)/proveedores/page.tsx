"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
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
    } else {
      await createProvider(input);
    }
    closeModal();
    await loadProviders();
  }

  async function handleDelete(provider: Provider) {
    if (!confirm(`¿Eliminar a "${provider.name}"? Esto no borra su historial, solo lo desactiva.`)) return;
    try {
      await deleteProvider(provider.id);
      await loadProviders();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo eliminar el proveedor");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-teal-600">Catálogo</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Proveedores</h1>
        </div>
        <button
          onClick={openCreate}
          className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
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
                ? "border-teal-600 bg-teal-50 text-teal-700"
                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3 font-medium">Nombre</th>
              <th className="px-5 py-3 font-medium">Tipo</th>
              <th className="px-5 py-3 font-medium">Contacto</th>
              <th className="px-5 py-3 font-medium">Notas</th>
              <th className="px-5 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {providers === null ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                  Cargando...
                </td>
              </tr>
            ) : providers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                  No hay proveedores con este filtro todavía.
                </td>
              </tr>
            ) : (
              providers.map((provider) => (
                <tr key={provider.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3.5 font-medium text-slate-900">{provider.name}</td>
                  <td className="px-5 py-3.5">
                    <Badge value={provider.type} />
                  </td>
                  <td className="px-5 py-3.5 text-slate-700">{provider.contactInfo ?? "—"}</td>
                  <td className="px-5 py-3.5 text-slate-500">{provider.notes ?? "—"}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(provider)}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(provider)}
                        className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50"
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
