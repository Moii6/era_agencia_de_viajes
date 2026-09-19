"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { listQuotes, Quote } from "@/lib/quotes";
import { ReservationInput } from "@/lib/reservations";

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none";
const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

type ReservationFormProps = {
  onSubmit: (input: ReservationInput) => Promise<unknown>;
  onCancel: () => void;
};

export function ReservationForm({ onSubmit, onCancel }: ReservationFormProps) {
  const [quoteId, setQuoteId] = useState("");
  const [quotes, setQuotes] = useState<Quote[] | null>(null);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    listQuotes({ status: "ACCEPTED" })
      .then(setQuotes)
      .catch(() => setQuotes([]));
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      await onSubmit({ quoteId });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear la reserva");
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="quoteId" className={labelClass}>
          Cotización aceptada *
        </label>
        <select
          id="quoteId"
          value={quoteId}
          onChange={(e) => setQuoteId(e.target.value)}
          className={inputClass}
          required
        >
          <option value="" disabled>
            Selecciona una cotización
          </option>
          {(quotes ?? []).map((quote) => (
            <option key={quote.id} value={quote.id}>
              {quote.client?.name} · {quote.trip?.name} · ${quote.total}
            </option>
          ))}
        </select>
        {quotes?.length === 0 ? (
          <p className="mt-1.5 text-xs text-slate-500">
            No hay cotizaciones en estado ACCEPTED todavía. Acepta una cotización antes de crear una
            reserva.
          </p>
        ) : null}
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
          disabled={isSaving || !quoteId}
          className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSaving ? "Guardando..." : "Crear reserva"}
        </button>
      </div>
    </form>
  );
}
