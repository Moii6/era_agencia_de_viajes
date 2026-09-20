"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { TripForm } from "@/components/forms/TripForm";
import { ApiError } from "@/lib/api";
import { formatDate } from "@/lib/formats";
import { createTrip, listTrips, Trip, TripInput, TripStatus } from "@/lib/trips";

const STATUS_FILTERS: { value: TripStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "DRAFT", label: "Borrador" },
  { value: "PUBLISHED", label: "Publicado" },
  { value: "CLOSED", label: "Cerrado" },
  { value: "COMPLETED", label: "Completado" },
  { value: "CANCELLED", label: "Cancelado" },
];

export default function ViajesPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [statusFilter, setStatusFilter] = useState<TripStatus | "ALL">("ALL");
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  async function loadTrips() {
    setError("");
    try {
      const data = await listTrips(statusFilter === "ALL" ? undefined : statusFilter);
      setTrips(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudieron cargar los viajes");
    }
  }

  useEffect(() => {
    loadTrips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function handleCreate(input: TripInput) {
    const trip = await createTrip(input);
    setShowCreateModal(false);
    router.push(`/viajes/${trip.id}`);
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-teal-600 dark:text-teal-400">Catálogo</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">Viajes</h1>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400"
        >
          + Nuevo viaje
        </button>
      </div>

      <div className="mt-6 flex gap-2">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
              statusFilter === filter.value
                ? "border-teal-600 bg-teal-50 text-teal-700 dark:border-teal-500 dark:bg-teal-500/10 dark:text-teal-300"
                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-600"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
            <tr>
              <th className="px-5 py-3 font-medium">Viaje</th>
              <th className="px-5 py-3 font-medium">Salida</th>
              <th className="px-5 py-3 font-medium">Cupo</th>
              <th className="px-5 py-3 font-medium">Catálogo</th>
              <th className="px-5 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {trips === null ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate-500 dark:text-slate-400">
                  Cargando...
                </td>
              </tr>
            ) : trips.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate-500 dark:text-slate-400">
                  No hay viajes con este filtro todavía.
                </td>
              </tr>
            ) : (
              trips.map((trip) => (
                <tr
                  key={trip.id}
                  onClick={() => router.push(`/viajes/${trip.id}`)}
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60"
                >
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-slate-900 dark:text-slate-100">{trip.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{trip.destination ?? "—"}</div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300">
                    {formatDate(trip.departureDate, { month: "short" })}
                  </td>
                  <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300">{trip.capacity}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                    {trip._count?.buses ?? 0} buses · {trip._count?.roomTypes ?? 0} habitaciones ·{" "}
                    {trip._count?.activities ?? 0} actividades
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge value={trip.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreateModal ? (
        <Modal title="Nuevo viaje" onClose={() => setShowCreateModal(false)} size="lg">
          <TripForm onSubmit={handleCreate} onCancel={() => setShowCreateModal(false)} />
        </Modal>
      ) : null}
    </div>
  );
}
