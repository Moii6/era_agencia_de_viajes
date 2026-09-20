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
  const [contacts, setContacts] = useState<string[]>(provider?.contacts?.length ? provider.contacts : [""]);
  const [notes, setNotes] = useState(provider?.notes ?? "");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function updateContact(index: number, value: string) {
    setContacts(contacts.map((c, i) => (i === index ? value : c)));
  }

  function removeContact(index: number) {
    setContacts(contacts.filter((_, i) => i !== index));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      await onSubmit({
        name,
        type,
        address: address || undefined,
        contacts: contacts.map((c) => c.trim()).filter(Boolean),
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
        <label className={labelClass}>Contacto</label>
        <div className="space-y-2">
          {contacts.map((contact, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                value={contact}
                onChange={(e) => updateContact(index, e.target.value)}
                className={inputClass}
                placeholder="Email o teléfono"
              />
              <button
                type="button"
                onClick={() => removeContact(index)}
                aria-label="Quitar contacto"
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setContacts([...contacts, ""])}
          className="mt-2 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          + Agregar contacto
        </button>
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
