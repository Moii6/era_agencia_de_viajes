"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api";
import { Activity, ActivityInput } from "@/lib/trips";

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none";
const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

type ActivityFormProps = {
  activity?: Activity;
  onSubmit: (input: ActivityInput) => Promise<unknown>;
  onCancel: () => void;
};

export function ActivityForm({ activity, onSubmit, onCancel }: ActivityFormProps) {
  const [name, setName] = useState(activity?.name ?? "");
  const [description, setDescription] = useState(activity?.description ?? "");
  const [hasExtraCost, setHasExtraCost] = useState(activity?.hasExtraCost ?? false);
  const [price, setPrice] = useState(activity?.price ?? "");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      await onSubmit({
        name,
        description: description || undefined,
        hasExtraCost,
        price: hasExtraCost && price ? Number(price) : undefined,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar la actividad");
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className={labelClass}>
          Nombre *
        </label>
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
          placeholder="Tour en yate"
          required
        />
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          Descripción
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClass}
          rows={2}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={hasExtraCost}
          onChange={(e) => setHasExtraCost(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 accent-teal-600 focus:ring-teal-600"
        />
        Tiene costo extra
      </label>

      {hasExtraCost ? (
        <div>
          <label htmlFor="price" className={labelClass}>
            Precio (MXN) *
          </label>
          <input
            id="price"
            type="number"
            min={0}
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={inputClass}
            required
          />
        </div>
      ) : null}

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
