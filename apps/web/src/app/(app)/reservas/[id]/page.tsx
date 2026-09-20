"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { OccupancyOption } from "@/components/forms/TravelerForm";
import { TravelersSection } from "@/components/reservations/TravelersSection";
import { DepositsSection } from "@/components/reservations/DepositsSection";
import { ApiError } from "@/lib/api";
import { formatDate } from "@/lib/formats";
import { getQuote, QuoteDetail } from "@/lib/quotes";
import {
  getReservation,
  RESERVATION_TRANSITIONS,
  ReservationDetail,
  ReservationStatus,
  updateReservation,
} from "@/lib/reservations";
import { Bus, listBuses } from "@/lib/trips";

export default function ReservationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [reservation, setReservation] = useState<ReservationDetail | null>(null);
  const [quote, setQuote] = useState<QuoteDetail | null>(null);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const data = await getReservation(params.id);
      setReservation(data);
      const [quoteData, busData] = await Promise.all([getQuote(data.quoteId), listBuses(data.quote.trip.id)]);
      setQuote(quoteData);
      setBuses(busData);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cargar la reserva");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function handleStatusChange(status: ReservationStatus) {
    try {
      await updateReservation(params.id, { status });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cambiar el estado");
    }
  }

  if (error && !reservation) {
    return <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-500/10 dark:text-rose-300">{error}</div>;
  }

  if (!reservation || !quote) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Cargando...</p>;
  }

  const nextStatuses = RESERVATION_TRANSITIONS[reservation.status];

  const occupancyOptions: OccupancyOption[] = quote.occupancies.map((occupancy) => {
    const capacity = occupancy.adults + occupancy.minors;
    const used = reservation.travelers.filter((t) => t.quoteOccupancyId === occupancy.id).length;
    return {
      id: occupancy.id,
      label: `${occupancy.label || occupancy.roomType?.name} (${used}/${capacity})`,
      disabled: used >= capacity,
    };
  });

  return (
    <div>
      <button onClick={() => router.push("/reservas")} className="mb-4 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
        ← Reservas
      </button>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{reservation.quote.client.name}</h1>
            <Badge value={reservation.status} />
          </div>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            {reservation.quote.trip.name} · Salida {formatDate(reservation.quote.trip.departureDate)}
          </p>
        </div>
        {nextStatuses.length > 0 ? (
          <select
            value=""
            onChange={(e) => handleStatusChange(e.target.value as ReservationStatus)}
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
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">Cliente</p>
          <p className="mt-2 text-sm text-slate-900 dark:text-slate-100">{reservation.quote.client.name}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{reservation.quote.client.email ?? "Sin email"}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{reservation.quote.client.phone ?? "Sin teléfono"}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">Viaje</p>
          <p className="mt-2 text-sm text-slate-900 dark:text-slate-100">{reservation.quote.trip.name}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Salida: {formatDate(reservation.quote.trip.departureDate)}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Anticipo mínimo: ${reservation.quote.trip.minimumDepositAmount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">Balance</p>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">Total: ${reservation.quote.total}</p>
          <p className="text-sm text-slate-700 dark:text-slate-300">Anticipado: ${reservation.depositsSum}</p>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Saldo: ${reservation.balance}</p>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <TravelersSection
            reservationId={reservation.id}
            travelers={reservation.travelers}
            occupancyOptions={occupancyOptions}
            buses={buses}
            onChange={load}
          />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <DepositsSection
            reservationId={reservation.id}
            deposits={reservation.deposits}
            minimumInitialAmount={Number(reservation.quote.trip.minimumDepositAmount)}
            onChange={load}
          />
        </div>
      </div>
    </div>
  );
}
