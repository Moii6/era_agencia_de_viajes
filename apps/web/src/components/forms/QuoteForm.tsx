"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api";
import { Client, listClients } from "@/lib/clients";
import { QuoteInput } from "@/lib/quotes";
import { listTrips, Trip } from "@/lib/trips";

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-teal-500";
const labelClass = "mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300";

type QuoteFormProps = {
  onSubmit: (input: QuoteInput) => Promise<unknown>;
  onCancel: () => void;
};

export function QuoteForm({ onSubmit, onCancel }: QuoteFormProps) {
  const toast = useToast();
  const [clientId, setClientId] = useState("");
  const [tripId, setTripId] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");

  const [clients, setClients] = useState<Client[] | null>(null);
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    listClients()
      .then(setClients)
      .catch(() => setClients([]));
    listTrips()
      .then(setTrips)
      .catch(() => setTrips([]));
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      await onSubmit({
        clientId,
        tripId,
        validUntil: validUntil || undefined,
        notes: notes || undefined,
      });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo crear la cotización";
      setError(message);
      toast.error(message);
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="clientId" className={labelClass}>
          Cliente *
        </label>
        <select
          id="clientId"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          className={inputClass}
          required
        >
          <option value="" disabled>
            Selecciona un cliente
          </option>
          {(clients ?? []).map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
        {clients?.length === 0 ? (
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">No hay clientes registrados todavía.</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="tripId" className={labelClass}>
          Viaje *
        </label>
        <select
          id="tripId"
          value={tripId}
          onChange={(e) => setTripId(e.target.value)}
          className={inputClass}
          required
        >
          <option value="" disabled>
            Selecciona un viaje
          </option>
          {(trips ?? []).map((trip) => (
            <option key={trip.id} value={trip.id}>
              {trip.name}
            </option>
          ))}
        </select>
        {trips?.length === 0 ? (
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">No hay viajes registrados todavía.</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="validUntil" className={labelClass}>
          Válida hasta
        </label>
        <input
          id="validUntil"
          type="date"
          value={validUntil}
          onChange={(e) => setValidUntil(e.target.value)}
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
          rows={3}
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
          {isSaving ? "Guardando..." : "Crear cotización"}
        </button>
      </div>
    </form>
  );
}
