"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { QuoteEditForm } from "@/components/forms/QuoteEditForm";
import { OccupanciesSection } from "@/components/quotes/OccupanciesSection";
import { ApiError } from "@/lib/api";
import { formatDate } from "@/lib/formats";
import {
  deleteQuote,
  getQuote,
  QUOTE_TRANSITIONS,
  QuoteDetail,
  QuoteStatus,
  QuoteUpdateInput,
  updateQuote,
} from "@/lib/quotes";

export default function QuoteDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [quote, setQuote] = useState<QuoteDetail | null>(null);
  const [error, setError] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);

  async function load() {
    setError("");
    try {
      setQuote(await getQuote(params.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cargar la cotización");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function handleEdit(input: QuoteUpdateInput) {
    await updateQuote(params.id, input);
    setShowEditModal(false);
    await load();
  }

  async function handleStatusChange(status: QuoteStatus) {
    try {
      await updateQuote(params.id, { status });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cambiar el estado");
    }
  }

  async function handleDelete() {
    if (!quote) return;
    if (!confirm("¿Eliminar esta cotización? Esta acción no se puede deshacer.")) return;
    try {
      await deleteQuote(quote.id);
      router.push("/cotizaciones");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo eliminar la cotización");
    }
  }

  if (error && !quote) {
    return <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>;
  }

  if (!quote) {
    return <p className="text-sm text-slate-500">Cargando...</p>;
  }

  const nextStatuses = QUOTE_TRANSITIONS[quote.status];
  const isDraft = quote.status === "DRAFT";

  return (
    <div>
      <button
        onClick={() => router.push("/cotizaciones")}
        className="mb-4 text-sm text-slate-500 hover:text-slate-700"
      >
        ← Cotizaciones
      </button>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-900">{quote.client.name}</h1>
            <Badge value={quote.status} />
          </div>
          <p className="mt-1 text-slate-500">
            {quote.trip.name} · Salida {formatDate(quote.trip.departureDate)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {nextStatuses.length > 0 ? (
            <select
              value=""
              onChange={(e) => handleStatusChange(e.target.value as QuoteStatus)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-teal-600 focus:outline-none"
            >
              <option value="" disabled>
                Cambiar estado...
              </option>
              {nextStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          ) : null}
          <button
            onClick={() => setShowEditModal(true)}
            className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Editar
          </button>
          {isDraft ? (
            <button
              onClick={handleDelete}
              className="rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-50"
            >
              Eliminar
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Cliente</p>
          <p className="mt-2 text-sm text-slate-900">{quote.client.name}</p>
          <p className="text-sm text-slate-500">{quote.client.email ?? "Sin email"}</p>
          <p className="text-sm text-slate-500">{quote.client.phone ?? "Sin teléfono"}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Viaje</p>
          <p className="mt-2 text-sm text-slate-900">{quote.trip.name}</p>
          <p className="text-sm text-slate-500">Salida: {formatDate(quote.trip.departureDate)}</p>
          <p className="text-sm text-slate-500">Retorno: {formatDate(quote.trip.returnDate)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Totales</p>
          <p className="mt-2 text-sm text-slate-700">Subtotal: ${quote.subtotal}</p>
          <p className="text-sm text-slate-700">Comisión (5%): ${quote.commission}</p>
          <p className="text-sm font-semibold text-slate-900">Total: ${quote.total}</p>
          {quote.validUntil ? (
            <p className="mt-1 text-xs text-slate-500">Válida hasta: {formatDate(quote.validUntil)}</p>
          ) : null}
        </div>
      </div>

      {quote.notes ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Notas</p>
          <p className="mt-2 text-sm text-slate-700">{quote.notes}</p>
        </div>
      ) : null}

      <div className="mt-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <OccupanciesSection
            quoteId={quote.id}
            tripId={quote.tripId}
            occupancies={quote.occupancies}
            editable={isDraft}
            onChange={load}
          />
        </div>
      </div>

      {showEditModal ? (
        <Modal title="Editar cotización" onClose={() => setShowEditModal(false)}>
          <QuoteEditForm quote={quote} onSubmit={handleEdit} onCancel={() => setShowEditModal(false)} />
        </Modal>
      ) : null}
    </div>
  );
}
