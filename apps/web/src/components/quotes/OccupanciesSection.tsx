"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { OccupancyForm } from "@/components/forms/OccupancyForm";
import { ApiError } from "@/lib/api";
import {
  createOccupancy,
  createOccupancyActivity,
  deleteOccupancy,
  deleteOccupancyActivity,
  OccupancyInput,
  OccupancyUpdateInput,
  QuoteOccupancy,
  updateOccupancy,
} from "@/lib/quotes";
import { Activity, listActivities, listRoomTypes, RoomType } from "@/lib/trips";

const inputClass =
  "rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-teal-600 focus:outline-none";

function ActivityAdder({
  activities,
  groupSize,
  onAdd,
}: {
  activities: Activity[];
  groupSize: number;
  onAdd: (input: { activityId: string; quantity: number }) => Promise<void>;
}) {
  const [activityId, setActivityId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [isSaving, setIsSaving] = useState(false);

  if (activities.length === 0) return null;

  async function handleAdd() {
    if (!activityId) return;
    setIsSaving(true);
    try {
      await onAdd({ activityId, quantity: Number(quantity) });
      setActivityId("");
      setQuantity("1");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <select value={activityId} onChange={(e) => setActivityId(e.target.value)} className={`${inputClass} flex-1`}>
        <option value="">Agregar actividad...</option>
        {activities.map((activity) => (
          <option key={activity.id} value={activity.id}>
            {activity.name}
            {activity.hasExtraCost ? ` (+$${activity.price})` : " (incluida)"}
          </option>
        ))}
      </select>
      <input
        type="number"
        min={1}
        max={groupSize}
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        className={`${inputClass} w-16`}
      />
      <button
        type="button"
        onClick={handleAdd}
        disabled={!activityId || isSaving}
        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        + Agregar
      </button>
    </div>
  );
}

type OccupanciesSectionProps = {
  quoteId: string;
  tripId: string;
  occupancies: QuoteOccupancy[];
  editable: boolean;
  onChange: () => void;
};

export function OccupanciesSection({ quoteId, tripId, occupancies, editable, onChange }: OccupanciesSectionProps) {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [error, setError] = useState("");
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingOccupancy, setEditingOccupancy] = useState<QuoteOccupancy | null>(null);

  useEffect(() => {
    listRoomTypes(tripId)
      .then(setRoomTypes)
      .catch(() => setRoomTypes([]));
    listActivities(tripId)
      .then(setActivities)
      .catch(() => setActivities([]));
  }, [tripId]);

  async function handleSubmit(input: OccupancyInput | OccupancyUpdateInput) {
    if (modalMode === "edit" && editingOccupancy) {
      await updateOccupancy(quoteId, editingOccupancy.id, input as OccupancyUpdateInput);
    } else {
      await createOccupancy(quoteId, input as OccupancyInput);
    }
    setModalMode(null);
    setEditingOccupancy(null);
    onChange();
  }

  async function handleDelete(occupancy: QuoteOccupancy) {
    if (!confirm(`¿Eliminar la ocupación "${occupancy.label ?? occupancy.roomType?.name}"?`)) return;
    try {
      await deleteOccupancy(quoteId, occupancy.id);
      onChange();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo eliminar la ocupación");
    }
  }

  async function handleAddActivity(occupancyId: string, input: { activityId: string; quantity: number }) {
    try {
      await createOccupancyActivity(quoteId, occupancyId, input);
      onChange();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo agregar la actividad");
    }
  }

  async function handleRemoveActivity(occupancyId: string, lineId: string) {
    try {
      await deleteOccupancyActivity(quoteId, occupancyId, lineId);
      onChange();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo quitar la actividad");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Ocupaciones</h3>
        {editable ? (
          <button
            onClick={() => {
              setEditingOccupancy(null);
              setModalMode("create");
            }}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            + Agregar
          </button>
        ) : null}
      </div>

      {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}

      <div className="mt-3 space-y-3">
        {occupancies.length === 0 ? (
          <p className="text-sm text-slate-500">Sin ocupaciones todavía.</p>
        ) : (
          occupancies.map((occupancy) => (
            <div key={occupancy.id} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {occupancy.label || occupancy.roomType?.name} · {occupancy.roomType?.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {occupancy.adults} adulto{occupancy.adults === 1 ? "" : "s"}
                    {occupancy.minors > 0 ? ` · ${occupancy.minors} menor${occupancy.minors === 1 ? "" : "es"}` : ""}
                    {" · "}Subtotal: ${occupancy.subtotal}
                  </p>
                </div>
                {editable ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingOccupancy(occupancy);
                        setModalMode("edit");
                      }}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(occupancy)}
                      className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50"
                    >
                      Eliminar
                    </button>
                  </div>
                ) : null}
              </div>

              {occupancy.activities && occupancy.activities.length > 0 ? (
                <ul className="mt-2 space-y-1 border-t border-slate-200 pt-2">
                  {occupancy.activities.map((line) => (
                    <li key={line.id} className="flex items-center justify-between text-xs text-slate-600">
                      <span>
                        {line.activity?.name} × {line.quantity} — ${line.subtotal}
                      </span>
                      {editable ? (
                        <button
                          onClick={() => handleRemoveActivity(occupancy.id, line.id)}
                          className="text-rose-600 hover:underline"
                        >
                          Quitar
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}

              {editable ? (
                <ActivityAdder
                  activities={activities}
                  groupSize={occupancy.adults + occupancy.minors}
                  onAdd={(input) => handleAddActivity(occupancy.id, input)}
                />
              ) : null}
            </div>
          ))
        )}
      </div>

      {modalMode ? (
        <Modal
          title={modalMode === "edit" ? "Editar ocupación" : "Nueva ocupación"}
          onClose={() => {
            setModalMode(null);
            setEditingOccupancy(null);
          }}
        >
          <OccupancyForm
            occupancy={editingOccupancy ?? undefined}
            roomTypes={roomTypes}
            onSubmit={handleSubmit}
            onCancel={() => {
              setModalMode(null);
              setEditingOccupancy(null);
            }}
          />
        </Modal>
      ) : null}
    </div>
  );
}
