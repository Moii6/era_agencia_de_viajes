"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api";
import { Provider, ProviderInput, ProviderType } from "@/lib/providers";

const TYPE_OPTIONS: { value: ProviderType; label: string }[] = [
  { value: "HOTEL", label: "Hotel" },
  { value: "TRANSPORT", label: "Transportista" },
  { value: "OTHER", label: "Otro" },
];

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none";
const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

type ProviderFormProps = {
  provider?: Provider;
  onSubmit: (input: ProviderInput) => Promise<unknown>;
  onCancel: () => void;
};

export function ProviderForm({ provider, onSubmit, onCancel }: ProviderFormProps) {
  const [name, setName] = useState(provider?.name ?? "");
  const [type, setType] = useState<ProviderType>(provider?.type ?? "HOTEL");
  const [address, setAddress] = useState(provider?.address ?? "");
  const [contactInfo, setContactInfo] = useState(provider?.contactInfo ?? "");
  const [notes, setNotes] = useState(provider?.notes ?? "");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      await onSubmit({
        name,
        type,
        address: address || undefined,
        contactInfo: contactInfo || undefined,
        notes: notes || undefined,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar el proveedor");
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
          required
          minLength={2}
        />
      </div>

      <div>
        <label htmlFor="type" className={labelClass}>
          Tipo
        </label>
        <select
          id="type"
          value={type}
          onChange={(e) => setType(e.target.value as ProviderType)}
          className={inputClass}
        >
          {TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="address" className={labelClass}>
          Dirección
        </label>
        <input
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className={inputClass}
          placeholder="Calle, número, colonia, ciudad"
        />
      </div>

      <div>
        <label htmlFor="contactInfo" className={labelClass}>
          Contacto
        </label>
        <input
          id="contactInfo"
          value={contactInfo}
          onChange={(e) => setContactInfo(e.target.value)}
          className={inputClass}
          placeholder="Email o teléfono"
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
          rows={3}
        />
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
