"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api";
import { Traveler, TravelerInput, TravelerType, TravelerUpdateInput } from "@/lib/reservations";

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-teal-500";
const labelClass = "mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300";

export type OccupancyOption = { id: string; label: string; disabled: boolean };

const TYPE_OPTIONS: { value: TravelerType; label: string }[] = [
  { value: "ADULT", label: "Adulto" },
  { value: "MINOR", label: "Menor" },
];

type TravelerFormProps = {
  traveler?: Traveler;
  occupancyOptions: OccupancyOption[];
  onSubmit: (input: TravelerInput | TravelerUpdateInput) => Promise<unknown>;
  onCancel: () => void;
};

export function TravelerForm({ traveler, occupancyOptions, onSubmit, onCancel }: TravelerFormProps) {
  const [quoteOccupancyId, setQuoteOccupancyId] = useState(traveler?.quoteOccupancyId ?? "");
  const [fullName, setFullName] = useState(traveler?.fullName ?? "");
  const [age, setAge] = useState(traveler?.age?.toString() ?? "");
  const [phone, setPhone] = useState(traveler?.phone ?? "");
  const [type, setType] = useState<TravelerType>(traveler?.type ?? "ADULT");
  const [isHolder, setIsHolder] = useState(traveler?.isHolder ?? false);
  const [documentId, setDocumentId] = useState(traveler?.documentId ?? "");
  const [notes, setNotes] = useState(traveler?.notes ?? "");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    const base = {
      fullName,
      age: Number(age),
      phone: phone || undefined,
      type,
      isHolder,
      documentId: documentId || undefined,
      notes: notes || undefined,
    };

    try {
      if (traveler) {
        await onSubmit(base);
      } else {
        await onSubmit({ ...base, quoteOccupancyId });
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar el viajero");
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="quoteOccupancyId" className={labelClass}>
          Ocupación *
        </label>
        {traveler ? (
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            {occupancyOptions.find((o) => o.id === traveler.quoteOccupancyId)?.label ?? "—"}
          </p>
        ) : (
          <select
            id="quoteOccupancyId"
            value={quoteOccupancyId}
            onChange={(e) => setQuoteOccupancyId(e.target.value)}
            className={inputClass}
            required
          >
            <option value="" disabled>
              Selecciona una ocupación
            </option>
            {occupancyOptions.map((option) => (
              <option key={option.id} value={option.id} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label htmlFor="fullName" className={labelClass}>
          Nombre completo *
        </label>
        <input
          id="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className={inputClass}
          required
          minLength={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="age" className={labelClass}>
            Edad *
          </label>
          <input
            id="age"
            type="number"
            min={0}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label htmlFor="type" className={labelClass}>
            Tipo *
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value as TravelerType)}
            className={inputClass}
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="phone" className={labelClass}>
          Teléfono {isHolder ? "*" : ""}
        </label>
        <input
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={inputClass}
          required={isHolder}
          placeholder="10 dígitos"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
        <input
          type="checkbox"
          checked={isHolder}
          onChange={(e) => setIsHolder(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 accent-teal-600 focus:ring-teal-600 dark:border-slate-600 dark:accent-teal-500"
        />
        Es el titular de la reserva
      </label>

      <div>
        <label htmlFor="documentId" className={labelClass}>
          Documento de identidad
        </label>
        <input
          id="documentId"
          value={documentId}
          onChange={(e) => setDocumentId(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="notes" className={labelClass}>
          Notas
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={inputClass}
          rows={2}
        />
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-500/10 dark:text-rose-300">{error}</div>
      ) : null}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-teal-500 dark:hover:bg-teal-400"
        >
          {isSaving ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}
