"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
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

const STATUS_TOAST_MESSAGES: Record<QuoteStatus, string> = {
  DRAFT: "Cotización actualizada",
  SENT: "Cotización enviada",
  ACCEPTED: "Cotización aceptada",
  REJECTED: "Cotización rechazada",
  EXPIRED: "Cotización marcada como expirada",
};

export default function QuoteDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const confirm = useConfirm();
  const toast = useToast();
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
    toast.success("Cotización actualizada");
    setShowEditModal(false);
    await load();
  }

  async function handleStatusChange(status: QuoteStatus) {
    try {
      await updateQuote(params.id, { status });
      toast.success(STATUS_TOAST_MESSAGES[status]);
      await load();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo cambiar el estado";
      setError(message);
      toast.error(message);
    }
  }

  async function handleDelete() {
    if (!quote) return;
    if (!(await confirm("¿Eliminar esta cotización? Esta acción no se puede deshacer.", { confirmLabel: "Eliminar" }))) return;
    try {
      await deleteQuote(quote.id);
      toast.success("Cotización eliminada");
      router.push("/cotizaciones");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo eliminar la cotización";
      setError(message);
      toast.error(message);
    }
  }

  if (error && !quote) {
    return <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-500/10 dark:text-rose-300">{error}</div>;
  }

  if (!quote) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Cargando...</p>;
  }

  const nextStatuses = QUOTE_TRANSITIONS[quote.status];
  const isDraft = quote.status === "DRAFT";

  return (
    <div>
      <button
        onClick={() => router.push("/cotizaciones")}
        className="mb-4 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      >
        ← Cotizaciones
      </button>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{quote.client.name}</h1>
            <Badge value={quote.status} />
          </div>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            {quote.trip.name} · Salida {formatDate(quote.trip.departureDate)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {nextStatuses.length > 0 ? (
            <select
              value=""
              onChange={(e) => handleStatusChange(e.target.value as QuoteStatus)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:focus:border-teal-500"
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
            className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400"
          >
            Editar
          </button>
          {isDraft ? (
            <button
              onClick={handleDelete}
              className="rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:bg-slate-900 dark:text-rose-300 dark:hover:bg-rose-500/10"
            >
              Eliminar
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">Cliente</p>
          <p className="mt-2 text-sm text-slate-900 dark:text-slate-100">{quote.client.name}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{quote.client.email ?? "Sin email"}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{quote.client.phone ?? "Sin teléfono"}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">Viaje</p>
          <p className="mt-2 text-sm text-slate-900 dark:text-slate-100">{quote.trip.name}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Salida: {formatDate(quote.trip.departureDate)}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Retorno: {formatDate(quote.trip.returnDate)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">Totales</p>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">Subtotal: ${quote.subtotal}</p>
          <p className="text-sm text-slate-700 dark:text-slate-300">Comisión (5%): ${quote.commission}</p>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Total: ${quote.total}</p>
          {quote.validUntil ? (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Válida hasta: {formatDate(quote.validUntil)}</p>
          ) : null}
        </div>
      </div>

      {quote.notes ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">Notas</p>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{quote.notes}</p>
        </div>
      ) : null}

      <div className="mt-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
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
