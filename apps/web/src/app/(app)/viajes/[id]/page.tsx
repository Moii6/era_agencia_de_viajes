"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { TripForm } from "@/components/forms/TripForm";
import { BusesSection } from "@/components/trips/BusesSection";
import { RoomTypesSection } from "@/components/trips/RoomTypesSection";
import { ActivitiesSection } from "@/components/trips/ActivitiesSection";
import { ApiError } from "@/lib/api";
import { formatDate } from "@/lib/formats";
import { getTrip, TripDetail, TripInput, TripStatus, updateTrip } from "@/lib/trips";

const STATUS_OPTIONS: TripStatus[] = ["DRAFT", "PUBLISHED", "CLOSED", "COMPLETED", "CANCELLED"];

export default function TripDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [error, setError] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);

  async function load() {
    setError("");
    try {
      setTrip(await getTrip(params.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cargar el viaje");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function handleEdit(input: TripInput) {
    await updateTrip(params.id, input);
    setShowEditModal(false);
    await load();
  }

  async function handleStatusChange(status: TripStatus) {
    try {
      await updateTrip(params.id, { status });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cambiar el estado");
    }
  }

  if (error && !trip) {
    return <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>;
  }

  if (!trip) {
    return <p className="text-sm text-slate-500">Cargando...</p>;
  }

  return (
    <div>
      <button onClick={() => router.push("/viajes")} className="mb-4 text-sm text-slate-500 hover:text-slate-700">
        ← Viajes
      </button>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-900">{trip.name}</h1>
            <Badge value={trip.status} />
          </div>
          <p className="mt-1 text-slate-500">{trip.destination ?? "Sin destino especificado"}</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={trip.status}
            onChange={(e) => handleStatusChange(e.target.value as TripStatus)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-teal-600 focus:outline-none"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowEditModal(true)}
            className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Editar
          </button>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Salida</p>
          <p className="mt-2 text-slate-900">{formatDate(trip.departureDate)}</p>
          <p className="text-sm text-slate-500">
            {trip.departureTime ? `${trip.departureTime} · ` : ""}
            {trip.departurePoint}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Retorno</p>
          <p className="mt-2 text-slate-900">{formatDate(trip.returnDate)}</p>
          <p className="text-sm text-slate-500">
            {trip.returnTime ? `${trip.returnTime} · ` : ""}
            {trip.returnPoint}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Transporte y hospedaje</p>
          <p className="mt-2 text-sm text-slate-700">
            {trip.transportIncluded ? "Transporte incluido" : "Sin transporte incluido"}
            {trip.transportNotes ? ` — ${trip.transportNotes}` : ""}
          </p>
          <p className="text-sm text-slate-700">
            {trip.lodgingIncluded
              ? `Hospedaje: ${trip.hotelProvider?.name ?? "sin hotel asignado"}`
              : "Sin hospedaje incluido"}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Cupo y anticipo</p>
          <p className="mt-2 text-sm text-slate-700">Cupo máximo: {trip.capacity}</p>
          <p className="text-sm text-slate-700">Anticipo mínimo: ${trip.minimumDepositAmount} MXN</p>
        </div>
      </div>

      {trip.notes ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Notas</p>
          <p className="mt-2 text-sm text-slate-700">{trip.notes}</p>
        </div>
      ) : null}

      <div className="mt-8 space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <BusesSection tripId={trip.id} />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <RoomTypesSection tripId={trip.id} />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <ActivitiesSection tripId={trip.id} />
        </div>
      </div>

      {showEditModal ? (
        <Modal title="Editar viaje" onClose={() => setShowEditModal(false)} size="lg">
          <TripForm trip={trip} onSubmit={handleEdit} onCancel={() => setShowEditModal(false)} />
        </Modal>
      ) : null}
    </div>
  );
}
