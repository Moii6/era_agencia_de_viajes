"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ApiError } from "@/lib/api";
import { formatDate } from "@/lib/formats";
import { getPublicQuote, PublicQuote } from "@/lib/quotes";

export default function PublicQuotePage() {
  const params = useParams<{ token: string }>();
  const [quote, setQuote] = useState<PublicQuote | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getPublicQuote(params.token)
      .then(setQuote)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "No se pudo cargar la cotización"),
      );
  }, [params.token]);

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
        <p className="text-center text-slate-600 dark:text-slate-400">{error}</p>
      </main>
    );
  }

  if (!quote) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
        <p className="text-slate-500 dark:text-slate-400">Cargando...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <div className="mx-auto max-w-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600 dark:text-teal-400">
          Travify
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
          Cotización para {quote.client.name}
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          {quote.trip.name}
          {quote.trip.destination ? ` · ${quote.trip.destination}` : ""}
        </p>

        {quote.status === "REJECTED" ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-500/10 dark:text-rose-300">
            Esta cotización fue rechazada.
          </div>
        ) : quote.status === "CANCELLED" ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-500/10 dark:text-rose-300">
            Esta cotización fue cancelada.
          </div>
        ) : quote.status === "EXPIRED" ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-500/10 dark:text-amber-300">
            Esta cotización ya expiró.
          </div>
        ) : quote.status === "ACCEPTED" ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-300">
            Cotización aceptada.
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">Salida</p>
            <p className="mt-2 text-sm text-slate-900 dark:text-slate-100">{formatDate(quote.trip.departureDate)}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{quote.trip.departurePoint}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">Retorno</p>
            <p className="mt-2 text-sm text-slate-900 dark:text-slate-100">{formatDate(quote.trip.returnDate)}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{quote.trip.returnPoint}</p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
            Incluye
          </p>
          <div className="mt-3 space-y-3">
            {quote.occupancies.map((occupancy, i) => (
              <div key={i} className="border-t border-slate-100 pt-3 first:border-t-0 first:pt-0 dark:border-slate-800">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {occupancy.label || occupancy.roomType.name} · {occupancy.roomType.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {occupancy.adults} adulto{occupancy.adults === 1 ? "" : "s"}
                  {occupancy.minors > 0 ? ` · ${occupancy.minors} menor${occupancy.minors === 1 ? "" : "es"}` : ""}
                </p>
                {occupancy.activities.length > 0 ? (
                  <ul className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {occupancy.activities.map((a, j) => (
                      <li key={j}>
                        {a.name}
                        {a.quantity > 1 ? ` × ${a.quantity}` : ""}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {quote.notes ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">Notas</p>
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{quote.notes}</p>
          </div>
        ) : null}

        <div className="mt-4 rounded-2xl border border-teal-200 bg-teal-50 p-5 text-center dark:border-teal-900 dark:bg-teal-500/10">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-teal-700 dark:text-teal-300">
            Precio total
          </p>
          <p className="mt-1 text-3xl font-bold text-teal-800 dark:text-teal-200">
            ${quote.total} {quote.currency}
          </p>
          {quote.validUntil ? (
            <p className="mt-2 text-xs text-teal-700/80 dark:text-teal-300/80">
              Válida hasta {formatDate(quote.validUntil)}
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
