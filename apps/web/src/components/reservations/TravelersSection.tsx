"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { OccupancyOption, TravelerForm } from "@/components/forms/TravelerForm";
import { ApiError } from "@/lib/api";
import {
  assignSeat,
  createTraveler,
  deleteTraveler,
  Traveler,
  TravelerInput,
  TravelerUpdateInput,
  unassignSeat,
  updateTraveler,
} from "@/lib/reservations";
import { Bus } from "@/lib/trips";

const TYPE_LABELS: Record<string, string> = { ADULT: "Adulto", MINOR: "Menor" };

const selectClass =
  "rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-teal-600 focus:outline-none";

function SeatAssigner({
  buses,
  onAssign,
}: {
  buses: Bus[];
  onAssign: (input: { busId: string; seatNumber: string }) => Promise<void>;
}) {
  const [busId, setBusId] = useState("");
  const [seatNumber, setSeatNumber] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (buses.length === 0) return null;

  async function handleAssign() {
    if (!busId || !seatNumber) return;
    setIsSaving(true);
    try {
      await onAssign({ busId, seatNumber });
      setBusId("");
      setSeatNumber("");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <select value={busId} onChange={(e) => setBusId(e.target.value)} className={`${selectClass} flex-1`}>
        <option value="">Asignar autobús...</option>
        {buses.map((bus) => (
          <option key={bus.id} value={bus.id}>
            {bus.label}
          </option>
        ))}
      </select>
      <input
        value={seatNumber}
        onChange={(e) => setSeatNumber(e.target.value)}
        placeholder="Asiento"
        className={`${selectClass} w-24`}
      />
      <button
        type="button"
        onClick={handleAssign}
        disabled={!busId || !seatNumber || isSaving}
        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Asignar
      </button>
    </div>
  );
}

type TravelersSectionProps = {
  reservationId: string;
  travelers: Traveler[];
  occupancyOptions: OccupancyOption[];
  buses: Bus[];
  onChange: () => void;
};

export function TravelersSection({ reservationId, travelers, occupancyOptions, buses, onChange }: TravelersSectionProps) {
  const [error, setError] = useState("");
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingTraveler, setEditingTraveler] = useState<Traveler | null>(null);

  async function handleSubmit(input: TravelerInput | TravelerUpdateInput) {
    if (modalMode === "edit" && editingTraveler) {
      await updateTraveler(reservationId, editingTraveler.id, input as TravelerUpdateInput);
    } else {
      await createTraveler(reservationId, input as TravelerInput);
    }
    setModalMode(null);
    setEditingTraveler(null);
    onChange();
  }

  async function handleDelete(traveler: Traveler) {
    if (!confirm(`¿Eliminar al viajero "${traveler.fullName}"?`)) return;
    try {
      await deleteTraveler(reservationId, traveler.id);
      onChange();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo eliminar el viajero");
    }
  }

  async function handleAssignSeat(travelerId: string, input: { busId: string; seatNumber: string }) {
    try {
      await assignSeat(reservationId, travelerId, input);
      onChange();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo asignar el asiento");
    }
  }

  async function handleUnassignSeat(travelerId: string) {
    try {
      await unassignSeat(reservationId, travelerId);
      onChange();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo quitar el asiento");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Viajeros</h3>
        <button
          onClick={() => {
            setEditingTraveler(null);
            setModalMode("create");
          }}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          + Agregar
        </button>
      </div>

      {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}

      <div className="mt-3 space-y-3">
        {travelers.length === 0 ? (
          <p className="text-sm text-slate-500">Sin viajeros todavía.</p>
        ) : (
          travelers.map((traveler) => (
            <div key={traveler.id} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {traveler.fullName}
                    {traveler.isHolder ? (
                      <span className="ml-2 rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-700">
                        Titular
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-slate-500">
                    {TYPE_LABELS[traveler.type]} · {traveler.age} años
                    {traveler.phone ? ` · ${traveler.phone}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingTraveler(traveler);
                      setModalMode("edit");
                    }}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(traveler)}
                    className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50"
                  >
                    Eliminar
                  </button>
                </div>
              </div>

              {traveler.seatAssignment ? (
                <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2 text-xs text-slate-600">
                  <span>
                    Asiento: {traveler.seatAssignment.bus?.label} · #{traveler.seatAssignment.seatNumber}
                  </span>
                  <button onClick={() => handleUnassignSeat(traveler.id)} className="text-rose-600 hover:underline">
                    Quitar asiento
                  </button>
                </div>
              ) : (
                <SeatAssigner buses={buses} onAssign={(input) => handleAssignSeat(traveler.id, input)} />
              )}
            </div>
          ))
        )}
      </div>

      {modalMode ? (
        <Modal
          title={modalMode === "edit" ? "Editar viajero" : "Nuevo viajero"}
          onClose={() => {
            setModalMode(null);
            setEditingTraveler(null);
          }}
        >
          <TravelerForm
            traveler={editingTraveler ?? undefined}
            occupancyOptions={occupancyOptions}
            onSubmit={handleSubmit}
            onCancel={() => {
              setModalMode(null);
              setEditingTraveler(null);
            }}
          />
        </Modal>
      ) : null}
    </div>
  );
}
