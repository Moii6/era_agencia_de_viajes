"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { BusForm } from "@/components/forms/BusForm";
import { ApiError } from "@/lib/api";
import { Bus, BusInput, createBus, deleteBus, listBuses, updateBus } from "@/lib/trips";

export function BusesSection({ tripId, readOnly = false }: { tripId: string; readOnly?: boolean }) {
  const confirm = useConfirm();
  const toast = useToast();
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
      toast.success("Autobús actualizado");
    } else {
      await createBus(tripId, input);
      toast.success("Autobús agregado");
    }
    setModalMode(null);
    setEditingBus(null);
    await load();
  }

  async function handleDelete(bus: Bus) {
    if (!(await confirm(`¿Eliminar el autobús "${bus.label}"?`, { confirmLabel: "Eliminar" }))) return;
    try {
      await deleteBus(tripId, bus.id);
      toast.success("Autobús eliminado");
      await load();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo eliminar el autobús";
      setError(message);
      toast.error(message);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Autobuses</h3>
        {readOnly ? null : (
          <button
            onClick={() => {
              setEditingBus(null);
              setModalMode("create");
            }}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            + Agregar
          </button>
        )}
      </div>

      {error ? <p className="mt-2 text-sm text-rose-700 dark:text-rose-400">{error}</p> : null}

      <div className="mt-3 space-y-2">
        {buses === null ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Cargando...</p>
        ) : buses.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Sin autobuses todavía.</p>
        ) : (
          buses.map((bus) => {
            const seats = (bus.seatAssignments ?? [])
              .slice()
              .sort((a, b) => Number(a.seatNumber) - Number(b.seatNumber));

            return (
              <div
                key={bus.id}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/60"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{bus.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {seats.length}/{bus.seatCapacity} asientos ocupados
                      {bus.driverName ? ` · Chofer: ${bus.driverName}` : ""}
                      {bus.plateOrUnitNumber ? ` · ${bus.plateOrUnitNumber}` : ""}
                    </p>
                  </div>
                  {readOnly ? null : (
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
                  )}
                </div>

                {seats.length > 0 ? (
                  <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 border-t border-slate-200 pt-2 dark:border-slate-700 sm:grid-cols-3">
                    {seats.map((seat) => {
                      const passengerName = seat.traveler?.fullName ?? seat.tripGuide?.user.name ?? "—";
                      const tag = seat.traveler?.isHolder
                        ? "Titular"
                        : seat.tripGuide
                          ? seat.tripGuide.isLead
                            ? "Guía líder"
                            : "Guía"
                          : null;
                      return (
                        <li
                          key={seat.seatNumber}
                          className="truncate text-xs text-slate-600 dark:text-slate-400"
                          title={passengerName}
                        >
                          <span className="font-medium text-slate-700 dark:text-slate-300">#{seat.seatNumber}</span>{" "}
                          {passengerName}
                          {tag ? ` · ${tag}` : ""}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="mt-2 border-t border-slate-200 pt-2 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    Sin pasajeros asignados todavía.
                  </p>
                )}
              </div>
            );
          })
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
