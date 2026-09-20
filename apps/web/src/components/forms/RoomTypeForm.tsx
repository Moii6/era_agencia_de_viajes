"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api";
import { RoomType, RoomTypeInput } from "@/lib/trips";

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none";
const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

type RoomTypeFormProps = {
  roomType?: RoomType;
  onSubmit: (input: RoomTypeInput) => Promise<unknown>;
  onCancel: () => void;
};

export function RoomTypeForm({ roomType, onSubmit, onCancel }: RoomTypeFormProps) {
  const [name, setName] = useState(roomType?.name ?? "");
  const [characteristics, setCharacteristics] = useState(roomType?.characteristics ?? "");
  const [maxOccupancy, setMaxOccupancy] = useState(roomType?.maxOccupancy?.toString() ?? "");
  const [pricePerNight, setPricePerNight] = useState(roomType?.pricePerNight ?? "");
  const [quantityAvailable, setQuantityAvailable] = useState(roomType?.quantityAvailable?.toString() ?? "");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      await onSubmit({
        name,
        characteristics: characteristics || undefined,
        maxOccupancy: Number(maxOccupancy),
        pricePerNight: Number(pricePerNight),
        quantityAvailable: quantityAvailable ? Number(quantityAvailable) : undefined,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar el tipo de habitación");
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className={labelClass}>
            Nombre *
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="Doble"
            required
          />
        </div>
        <div>
          <label htmlFor="maxOccupancy" className={labelClass}>
            Ocupación máxima *
          </label>
          <input
            id="maxOccupancy"
            type="number"
            min={1}
            value={maxOccupancy}
            onChange={(e) => setMaxOccupancy(e.target.value)}
            className={inputClass}
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="characteristics" className={labelClass}>
          Características
        </label>
        <input
          id="characteristics"
          value={characteristics}
          onChange={(e) => setCharacteristics(e.target.value)}
          className={inputClass}
          placeholder="2 camas queen, vista al mar"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="pricePerNight" className={labelClass}>
            Precio por noche (MXN) *
          </label>
          <input
            id="pricePerNight"
            type="number"
            min={0}
            step="0.01"
            value={pricePerNight}
            onChange={(e) => setPricePerNight(e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label htmlFor="quantityAvailable" className={labelClass}>
            Habitaciones disp.
          </label>
          <input
            id="quantityAvailable"
            type="number"
            min={0}
            value={quantityAvailable}
            onChange={(e) => setQuantityAvailable(e.target.value)}
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
