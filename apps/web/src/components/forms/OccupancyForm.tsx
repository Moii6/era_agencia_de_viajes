"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api";
import { OccupancyInput, OccupancyUpdateInput, QuoteOccupancy } from "@/lib/quotes";
import { RoomType } from "@/lib/trips";

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none";
const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

type OccupancyFormProps = {
  occupancy?: QuoteOccupancy;
  roomTypes: RoomType[];
  onSubmit: (input: OccupancyInput | OccupancyUpdateInput) => Promise<unknown>;
  onCancel: () => void;
};

export function OccupancyForm({ occupancy, roomTypes, onSubmit, onCancel }: OccupancyFormProps) {
  const [roomTypeId, setRoomTypeId] = useState(occupancy?.roomTypeId ?? "");
  const [label, setLabel] = useState(occupancy?.label ?? "");
  const [adults, setAdults] = useState(occupancy?.adults?.toString() ?? "1");
  const [minors, setMinors] = useState(occupancy?.minors?.toString() ?? "0");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      if (occupancy) {
        await onSubmit({
          label: label || undefined,
          adults: Number(adults),
          minors: Number(minors),
        });
      } else {
        await onSubmit({
          roomTypeId,
          label: label || undefined,
          adults: Number(adults),
          minors: Number(minors),
        });
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar la ocupación");
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="roomTypeId" className={labelClass}>
          Tipo de habitación *
        </label>
        {occupancy ? (
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-600">
            {occupancy.roomType?.name ?? "—"}
          </p>
        ) : (
          <select
            id="roomTypeId"
            value={roomTypeId}
            onChange={(e) => setRoomTypeId(e.target.value)}
            className={inputClass}
            required
          >
            <option value="" disabled>
              Selecciona un tipo de habitación
            </option>
            {roomTypes.map((roomType) => (
              <option key={roomType.id} value={roomType.id}>
                {roomType.name} (hasta {roomType.maxOccupancy}) — ${roomType.pricePerNight}/noche
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label htmlFor="label" className={labelClass}>
          Etiqueta
        </label>
        <input
          id="label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className={inputClass}
          placeholder="Habitación 1"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="adults" className={labelClass}>
            Adultos *
          </label>
          <input
            id="adults"
            type="number"
            min={0}
            value={adults}
            onChange={(e) => setAdults(e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label htmlFor="minors" className={labelClass}>
            Menores
          </label>
          <input
            id="minors"
            type="number"
            min={0}
            value={minors}
            onChange={(e) => setMinors(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
      ) : null}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSaving ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}
