"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { ReservationForm } from "@/components/forms/ReservationForm";
import { ApiError } from "@/lib/api";
import { formatDate } from "@/lib/formats";
import { createReservation, listReservations, Reservation, ReservationInput, ReservationStatus } from "@/lib/reservations";

const STATUS_FILTERS: { value: ReservationStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Todas" },
  { value: "PENDING_DEPOSIT", label: "Pendiente de anticipo" },
  { value: "CONFIRMED", label: "Confirmada" },
  { value: "COMPLETED", label: "Completado" },
  { value: "CANCELLED", label: "Cancelada" },
];

export default function ReservasPage() {
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[] | null>(null);
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | "ALL">("ALL");
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  async function loadReservations() {
    setError("");
    try {
      const data = await listReservations(statusFilter === "ALL" ? undefined : { status: statusFilter });
      setReservations(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudieron cargar las reservas");
    }
  }

  useEffect(() => {
    loadReservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function handleCreate(input: ReservationInput) {
    const reservation = await createReservation(input);
    setShowCreateModal(false);
    router.push(`/reservas/${reservation.id}`);
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-teal-600">Ventas</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Reservas</h1>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
        >
          + Nueva reserva
        </button>
      </div>

      <div className="mt-6 flex gap-2">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
              statusFilter === filter.value
                ? "border-teal-600 bg-teal-50 text-teal-700"
                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3 font-medium">Cliente</th>
              <th className="px-5 py-3 font-medium">Viaje</th>
              <th className="px-5 py-3 font-medium">Salida</th>
              <th className="px-5 py-3 font-medium">Total</th>
              <th className="px-5 py-3 font-medium">Viajeros</th>
              <th className="px-5 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {reservations === null ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                  Cargando...
                </td>
              </tr>
            ) : reservations.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                  No hay reservas con este filtro todavía.
                </td>
              </tr>
            ) : (
              reservations.map((reservation) => (
                <tr
                  key={reservation.id}
                  onClick={() => router.push(`/reservas/${reservation.id}`)}
                  className="cursor-pointer hover:bg-slate-50"
                >
                  <td className="px-5 py-3.5 font-medium text-slate-900">
                    {reservation.quote?.client.name ?? "—"}
                  </td>
                  <td className="px-5 py-3.5 text-slate-700">{reservation.quote?.trip.name ?? "—"}</td>
                  <td className="px-5 py-3.5 text-slate-700">
                    {reservation.quote?.trip.departureDate
                      ? formatDate(reservation.quote.trip.departureDate, { month: "short" })
                      : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-slate-700">${reservation.quote?.total ?? "0"}</td>
                  <td className="px-5 py-3.5 text-slate-700">{reservation._count?.travelers ?? 0}</td>
                  <td className="px-5 py-3.5">
                    <Badge value={reservation.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreateModal ? (
        <Modal title="Nueva reserva" onClose={() => setShowCreateModal(false)}>
          <ReservationForm onSubmit={handleCreate} onCancel={() => setShowCreateModal(false)} />
        </Modal>
      ) : null}
    </div>
  );
}
