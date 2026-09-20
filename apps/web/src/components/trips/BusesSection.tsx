"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { BusForm } from "@/components/forms/BusForm";
import { ApiError } from "@/lib/api";
import { Bus, BusInput, createBus, deleteBus, listBuses, updateBus } from "@/lib/trips";

export function BusesSection({ tripId }: { tripId: string }) {
  const [buses, setBuses] = useState<Bus[] | null>(null);
  const [error, setError] = useState("");
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingBus, setEditingBus] = useState<Bus | null>(null);

  async function load() {
    try {
      setBuses(await listBuses(tripId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudieron cargar los autobuses");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  async function handleSubmit(input: BusInput) {
    if (modalMode === "edit" && editingBus) {
      await updateBus(tripId, editingBus.id, input);
    } else {
      await createBus(tripId, input);
    }
    setModalMode(null);
    setEditingBus(null);
    await load();
  }

  async function handleDelete(bus: Bus) {
    if (!confirm(`¿Eliminar el autobús "${bus.label}"?`)) return;
    try {
      await deleteBus(tripId, bus.id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo eliminar el autobús");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Autobuses</h3>
        <button
          onClick={() => {
            setEditingBus(null);
            setModalMode("create");
          }}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          + Agregar
        </button>
      </div>

      {error ? <p className="mt-2 text-sm text-rose-700 dark:text-rose-400">{error}</p> : null}

      <div className="mt-3 space-y-2">
        {buses === null ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Cargando...</p>
        ) : buses.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Sin autobuses todavía.</p>
        ) : (
          buses.map((bus) => (
            <div
              key={bus.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/60"
            >
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{bus.label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {bus.seatCapacity} asientos
                  {bus.driverName ? ` · Chofer: ${bus.driverName}` : ""}
                  {bus.plateOrUnitNumber ? ` · ${bus.plateOrUnitNumber}` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingBus(bus);
                    setModalMode("edit");
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(bus)}
                  className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:bg-slate-800 dark:text-rose-300 dark:hover:bg-rose-500/10"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {modalMode ? (
        <Modal
          title={modalMode === "edit" ? "Editar autobús" : "Nuevo autobús"}
          onClose={() => {
            setModalMode(null);
            setEditingBus(null);
          }}
        >
          <BusForm
            bus={editingBus ?? undefined}
            onSubmit={handleSubmit}
            onCancel={() => {
              setModalMode(null);
              setEditingBus(null);
            }}
          />
        </Modal>
      ) : null}
    </div>
  );
}
